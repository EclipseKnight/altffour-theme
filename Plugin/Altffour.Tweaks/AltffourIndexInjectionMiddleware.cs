using System.Text;
using Microsoft.AspNetCore.Http;

namespace Altffour.Plugin.Tweaks;

internal sealed class AltffourIndexInjectionMiddleware
{
    private const string JsInjectorPublicLoaderId = "altffour-jsinjector-public-loader";
    private const string JsInjectorPublicScriptId = "javascriptinjector-public";

    private readonly RequestDelegate _next;

    public AltffourIndexInjectionMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        if (!HttpMethods.IsGet(context.Request.Method) || !IsIndexRequest(context.Request.Path.Value))
        {
            await _next(context);
            return;
        }

        AskForPlainFullPage(context.Request);

        var originalBody = context.Response.Body;
        await using var buffer = new MemoryStream();
        context.Response.Body = buffer;

        try
        {
            await _next(context);

            buffer.Position = 0;
            if (context.Response.StatusCode == StatusCodes.Status200OK
                && IsHtmlResponse(context.Response.ContentType)
                && !IsEncoded(context.Response))
            {
                using var reader = new StreamReader(buffer, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
                var html = await reader.ReadToEndAsync();
                var patched = InjectFallbackScripts(html);

                var bytes = Encoding.UTF8.GetBytes(patched);
                context.Response.Body = originalBody;
                context.Response.ContentLength = bytes.Length;
                // The validators describe the file on disk. The page sent here differs from it, so a
                // browser must not reuse them to get a 304 for a page it never cached in this form.
                context.Response.Headers.Remove("ETag");
                context.Response.Headers.Remove("Last-Modified");
                await context.Response.Body.WriteAsync(bytes, 0, bytes.Length);
                return;
            }

            buffer.Position = 0;
            context.Response.Body = originalBody;
            await buffer.CopyToAsync(originalBody);
        }
        finally
        {
            context.Response.Body = originalBody;
        }
    }

    /// <summary>
    /// Makes Jellyfin answer this one request with the whole page as plain bytes, so it can be
    /// edited as text.
    /// </summary>
    /// <remarks>
    /// Jellyfin compresses responses (brotli or gzip) inside this middleware, so with the browser's
    /// Accept-Encoding the buffer would hold compressed bytes, and decoding them as UTF-8 sends the
    /// browser garbage still marked as compressed. Dropping the header is simpler than unpacking
    /// and repacking, and index.html is small enough to send as it is.
    /// Conditional and range headers go too, or Jellyfin answers 304 or 206 and the page is passed
    /// on without the loader.
    /// </remarks>
    private static void AskForPlainFullPage(HttpRequest request)
    {
        var headers = request.Headers;
        headers.Remove("Accept-Encoding");
        headers.Remove("If-None-Match");
        headers.Remove("If-Modified-Since");
        headers.Remove("Range");
        headers.Remove("If-Range");
    }

    /// <summary>
    /// True when the page still came back encoded (something else compressed it anyway). Such a
    /// page is passed on untouched: a page without the loader is better than a broken one.
    /// </summary>
    private static bool IsEncoded(HttpResponse response)
    {
        var encoding = response.Headers.ContentEncoding.ToString();
        return !string.IsNullOrWhiteSpace(encoding)
            && !string.Equals(encoding, "identity", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsIndexRequest(string? path)
    {
        return string.Equals(path, "/web/index.html", StringComparison.OrdinalIgnoreCase)
            || string.Equals(path, "/web/", StringComparison.OrdinalIgnoreCase)
            || string.Equals(path, "/web", StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsHtmlResponse(string? contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType))
        {
            return true;
        }

        return contentType.Contains("text/html", StringComparison.OrdinalIgnoreCase);
    }

    private static string InjectFallbackScripts(string html)
    {
        if (string.IsNullOrWhiteSpace(html))
        {
            return html;
        }

        if (html.Contains($"id=\"{JsInjectorPublicLoaderId}\"", StringComparison.OrdinalIgnoreCase))
        {
            return html;
        }

        var injection = BuildFallbackInjection();
        if (html.Contains("</body>", StringComparison.OrdinalIgnoreCase))
        {
            return html.Replace("</body>", injection + Environment.NewLine + "</body>", StringComparison.OrdinalIgnoreCase);
        }

        if (html.Contains("</head>", StringComparison.OrdinalIgnoreCase))
        {
            return html.Replace("</head>", injection + Environment.NewLine + "</head>", StringComparison.OrdinalIgnoreCase);
        }

        return html + Environment.NewLine + injection;
    }

    private static string BuildFallbackInjection()
    {
        return $$"""
<script id="{{JsInjectorPublicLoaderId}}">
if (!document.getElementById('{{JsInjectorPublicScriptId}}')) {
  const script = document.createElement('script');
  script.id = '{{JsInjectorPublicScriptId}}';
  script.src = '/javascriptinjector/public.js';
  script.defer = true;
  document.head.appendChild(script);
}
</script>
""";
    }
}
