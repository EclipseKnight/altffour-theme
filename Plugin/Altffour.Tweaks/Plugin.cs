using System.Collections.Generic;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace Altffour.Plugin.Tweaks;

public sealed class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages
{
    private readonly IApplicationPaths _applicationPaths;

    public static Plugin? Instance { get; private set; }

    public Plugin(IApplicationPaths applicationPaths, IXmlSerializer xmlSerializer)
        : base(applicationPaths, xmlSerializer)
    {
        _applicationPaths = applicationPaths;
        Instance = this;
    }

    public override string Name => "Altffour Tweaks Plugin";

    public override string Description => "Registers Altffour web UI tweaks via JavaScript Injector.";

    public override Guid Id => Guid.Parse("6ba080fc-ff40-4c6c-a59d-9874f96d4206");

    public override void UpdateConfiguration(BasePluginConfiguration configuration)
    {
        if (configuration is PluginConfiguration normalizedConfiguration)
        {
            NormalizeRuntimeDependencies(normalizedConfiguration);
        }

        base.UpdateConfiguration(configuration);

        if (configuration is PluginConfiguration pluginConfiguration)
        {
            var syncResult = InjectorConfigSynchronizer.Synchronize(_applicationPaths, pluginConfiguration, null);
            PluginHealthEvaluator.EvaluateAndPersist(_applicationPaths, pluginConfiguration, syncResult, null);
        }
    }

    public IEnumerable<PluginPageInfo> GetPages()
    {
        yield return new PluginPageInfo
        {
            Name = "altffourTweaks",
            DisplayName = "Altffour Tweaks",
            EmbeddedResourcePath = "Altffour.Plugin.Tweaks.Configuration.config.html"
        };
    }

    internal static void NormalizeRuntimeDependencies(PluginConfiguration configuration)
    {
        if (configuration.EnableTweaksLoader)
        {
            return;
        }

        configuration.EnableDynamicHomeSpacer = false;
        configuration.EnableExtraCardButtonsVisibility = false;
    }
}
