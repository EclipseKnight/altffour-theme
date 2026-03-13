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

        var originalBody = context.Response.Body;
        await using var buffer = new MemoryStream();
        context.Response.Body = buffer;

        try
        {
            await _next(context);

            buffer.Position = 0;
            if (context.Response.StatusCode == StatusCodes.Status200OK && IsHtmlResponse(context.Response.ContentType))
            {
                using var reader = new StreamReader(buffer, Encoding.UTF8, detectEncodingFromByteOrderMarks: true, leaveOpen: true);
                var html = await reader.ReadToEndAsync();
                var patched = InjectFallbackScripts(html);

                var bytes = Encoding.UTF8.GetBytes(patched);
                context.Response.Body = originalBody;
                context.Response.ContentLength = bytes.Length;
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
