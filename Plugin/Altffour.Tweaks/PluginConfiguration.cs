using MediaBrowser.Model.Plugins;

namespace Altffour.Plugin.Tweaks;

public sealed class PluginConfiguration : BasePluginConfiguration
{
    public string ThemePalette { get; set; } = "ocean";

    public bool EnableTweaksLoader { get; set; } = true;

    public bool EnableDynamicHomeSpacer { get; set; } = true;

    public bool EnableExtraCardButtonsVisibility { get; set; }

    public bool EnableMediaBarPluginSupport { get; set; }

    public bool EnableInPlayerEpisodePreviewSupport { get; set; }

    public string LastHealthCheckUtc { get; set; } = string.Empty;

    public bool JavaScriptInjectorInstalled { get; set; }

    public bool JavaScriptInjectorActive { get; set; }

    public string JavaScriptInjectorStatus { get; set; } = "unknown";

    public bool JavaScriptInjectorConfigFound { get; set; }

    public bool RuntimeAssetHealthy { get; set; }

    public int RuntimeAssetStatusCode { get; set; }

    public string RuntimeAssetError { get; set; } = string.Empty;

    public bool MediaBarAssetHealthy { get; set; }

    public int MediaBarAssetStatusCode { get; set; }

    public string MediaBarAssetError { get; set; } = string.Empty;

    public bool InPlayerAssetHealthy { get; set; }

    public int InPlayerAssetStatusCode { get; set; }

    public string InPlayerAssetError { get; set; } = string.Empty;

    public bool LastSelfHealHadChanges { get; set; }

    public string LastSelfHealSummary { get; set; } = string.Empty;

    public string[] LastSelfHealActions { get; set; } = Array.Empty<string>();

    public string[] ConflictWarnings { get; set; } = Array.Empty<string>();
}
