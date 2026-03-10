using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Altffour.Plugin.Tweaks;

public sealed class StartupService : IHostedService
{
    private readonly ILogger<StartupService> _logger;
    private readonly IApplicationPaths _applicationPaths;

    public StartupService(ILogger<StartupService> logger, IApplicationPaths applicationPaths)
    {
        _logger = logger;
        _applicationPaths = applicationPaths;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        if (Plugin.Instance is null)
        {
            _logger.LogWarning(
                "Altffour Tweaks startup sync skipped because plugin instance is not initialized yet. " +
                "Configuration will sync on the next plugin configuration update.");
            return Task.CompletedTask;
        }

        var pluginConfiguration = Plugin.Instance.Configuration;
        Plugin.NormalizeRuntimeDependencies(pluginConfiguration);
        var syncResult = InjectorConfigSynchronizer.Synchronize(_applicationPaths, pluginConfiguration, _logger);
        PluginHealthEvaluator.EvaluateAndPersist(_applicationPaths, pluginConfiguration, syncResult, _logger);

        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
        => Task.CompletedTask;
}
