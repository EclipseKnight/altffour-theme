using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;

namespace Altffour.Plugin.Tweaks;

internal sealed class AltffourIndexInjectionStartupFilter : IStartupFilter
{
    public Action<IApplicationBuilder> Configure(Action<IApplicationBuilder> next)
    {
        return app =>
        {
            app.UseMiddleware<AltffourIndexInjectionMiddleware>();
            next(app);
        };
    }
}
