using System.IO.Compression;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace Altffour.Plugin.Tweaks.Tests;

/// <summary>
/// Runs Tweaks' index.html middleware the way Jellyfin does: in front of ASP.NET Core's response
/// compression (brotli and gzip), with a last step that serves the page like a static file
/// (ETag, 304 for a matching If-None-Match, 206 for a Range).
/// </summary>
public class IndexInjectionMiddlewareTests
{
    private const string Page =
        "<!DOCTYPE html><html><head><title>Jellyfin</title></head><body><div id=\"reactRoot\"></div></body></html>";

    private const string LoaderMarker = "id=\"altffour-jsinjector-public-loader\"";
    private const string PageETag = "\"page-1\"";
    private const string Script = "console.log('a web client bundle, long enough to be worth compressing');";

    [Theory]
    [InlineData("/web/index.html")]
    [InlineData("/web/")]
    [InlineData("/web")]
    public async Task Index_asked_for_with_compression_comes_back_plain_with_the_loader(string path)
    {
        var context = await Send(BuildJellyfinLikePipeline(), path, ("Accept-Encoding", "br, gzip"));

        Assert.Equal(200, context.Response.StatusCode);
        Assert.False(context.Response.Headers.ContainsKey("Content-Encoding"));
        var body = ReadBody(context);
        var html = Encoding.UTF8.GetString(body);
        Assert.StartsWith("<!DOCTYPE html>", html);
        Assert.Contains("<div id=\"reactRoot\"></div>", html);
        Assert.Contains(LoaderMarker, html);
        Assert.Equal(body.Length, context.Response.ContentLength);
    }

    [Fact]
    public async Task Index_asked_for_with_gzip_only_comes_back_plain_with_the_loader()
    {
        var context = await Send(BuildJellyfinLikePipeline(), "/web/index.html", ("Accept-Encoding", "gzip"));

        Assert.False(context.Response.Headers.ContainsKey("Content-Encoding"));
        Assert.Contains(LoaderMarker, Encoding.UTF8.GetString(ReadBody(context)));
    }

    [Fact]
    public async Task A_matching_If_None_Match_still_gets_the_injected_page()
    {
        var context = await Send(BuildJellyfinLikePipeline(), "/web/index.html", ("If-None-Match", PageETag));

        Assert.Equal(200, context.Response.StatusCode);
        Assert.Contains(LoaderMarker, Encoding.UTF8.GetString(ReadBody(context)));
    }

    [Fact]
    public async Task A_range_request_still_gets_the_whole_injected_page()
    {
        var context = await Send(BuildJellyfinLikePipeline(), "/web/index.html", ("Range", "bytes=0-9"));

        Assert.Equal(200, context.Response.StatusCode);
        var html = Encoding.UTF8.GetString(ReadBody(context));
        Assert.StartsWith("<!DOCTYPE html>", html);
        Assert.Contains(LoaderMarker, html);
    }

    [Fact]
    public async Task The_rewritten_page_drops_the_file_validators()
    {
        var context = await Send(BuildJellyfinLikePipeline(), "/web/index.html");

        // The ETag and Last-Modified describe the file on disk, not the page Tweaks sends.
        Assert.False(context.Response.Headers.ContainsKey("ETag"));
        Assert.False(context.Response.Headers.ContainsKey("Last-Modified"));
    }

    [Fact]
    public async Task Other_web_files_are_still_compressed()
    {
        var context = await Send(BuildJellyfinLikePipeline(), "/web/main.bundle.js", ("Accept-Encoding", "br, gzip"));

        Assert.Equal("br", context.Response.Headers.ContentEncoding.ToString());
        using var brotli = new BrotliStream(new MemoryStream(ReadBody(context)), CompressionMode.Decompress);
        using var reader = new StreamReader(brotli, Encoding.UTF8);
        Assert.Equal(Script, reader.ReadToEnd());
    }

    [Fact]
    public async Task A_page_that_still_arrives_encoded_is_passed_on_untouched()
    {
        // Something inside the pipeline that compresses no matter what the request says.
        var gzipped = Gzip(Page);
        var pipeline = BuildPipeline(app => app.Run(async context =>
        {
            context.Response.ContentType = "text/html";
            context.Response.Headers.ContentEncoding = "gzip";
            await context.Response.Body.WriteAsync(gzipped);
        }));

        var context = await Send(pipeline, "/web/index.html", ("Accept-Encoding", "gzip"));

        Assert.Equal("gzip", context.Response.Headers.ContentEncoding.ToString());
        Assert.Equal(gzipped, ReadBody(context));
    }

    private static RequestDelegate BuildJellyfinLikePipeline()
    {
        return BuildPipeline(app =>
        {
            app.UseResponseCompression();
            app.Run(ServeLikeStaticFiles);
        });
    }

    private static RequestDelegate BuildPipeline(Action<IApplicationBuilder> inner)
    {
        var services = new ServiceCollection();
        services.AddLogging();
        services.AddResponseCompression(options =>
        {
            options.Providers.Add<BrotliCompressionProvider>();
            options.Providers.Add<GzipCompressionProvider>();
        });

        var app = new ApplicationBuilder(services.BuildServiceProvider());
        app.UseMiddleware<AltffourIndexInjectionMiddleware>();
        inner(app);
        return app.Build();
    }

    private static async Task ServeLikeStaticFiles(HttpContext context)
    {
        var isScript = context.Request.Path.Value!.EndsWith(".js", StringComparison.Ordinal);
        var content = Encoding.UTF8.GetBytes(isScript ? Script : Page);
        context.Response.ContentType = isScript ? "application/javascript" : "text/html";
        context.Response.Headers.ETag = PageETag;
        context.Response.Headers.LastModified = "Mon, 05 Oct 2026 00:00:00 GMT";

        if (context.Request.Headers.IfNoneMatch == PageETag)
        {
            context.Response.StatusCode = StatusCodes.Status304NotModified;
            return;
        }

        if (context.Request.Headers.Range.ToString() == "bytes=0-9")
        {
            context.Response.StatusCode = StatusCodes.Status206PartialContent;
            context.Response.Headers.ContentRange = $"bytes 0-9/{content.Length}";
            await context.Response.Body.WriteAsync(content.AsMemory(0, 10));
            return;
        }

        context.Response.ContentLength = content.Length;
        await context.Response.Body.WriteAsync(content);
    }

    private static async Task<HttpContext> Send(RequestDelegate pipeline, string path, params (string Name, string Value)[] headers)
    {
        var context = new DefaultHttpContext();
        context.Request.Method = HttpMethods.Get;
        context.Request.Path = path;
        foreach (var (name, value) in headers)
        {
            context.Request.Headers[name] = value;
        }

        context.Response.Body = new MemoryStream();
        await pipeline(context);
        return context;
    }

    private static byte[] ReadBody(HttpContext context)
    {
        return ((MemoryStream)context.Response.Body).ToArray();
    }

    private static byte[] Gzip(string text)
    {
        using var output = new MemoryStream();
        using (var gzip = new GZipStream(output, CompressionLevel.Optimal))
        {
            gzip.Write(Encoding.UTF8.GetBytes(text));
        }

        return output.ToArray();
    }
}
