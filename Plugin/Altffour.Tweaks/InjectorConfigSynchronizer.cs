using System.Xml.Linq;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Logging;

namespace Altffour.Plugin.Tweaks;

internal sealed class InjectorSyncResult
{
    public bool Success { get; set; } = true;

    public bool ConfigFound { get; set; }

    public bool Changed { get; set; }

    public string ConfigPath { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string[] Actions { get; set; } = Array.Empty<string>();
}

internal static class InjectorConfigSynchronizer
{
    private const string JavaScriptInjectorConfigFile = "Jellyfin.Plugin.JavaScriptInjector.xml";
    private const string BaseAddOnUrl = "https://altffour.com/jellyfin-theme/add-ons";

    private const string RuntimeEntryName = "Altffour Tweaks Plugin";
    private const string UserThemeSelectorEntryName = "Altffour User Theme Selector";
    private const string MediaBarSupportEntryName = "Altffour Tweaks - Media Bar Support";
    private const string InPlayerEpisodePreviewSupportEntryName = "Altffour Tweaks - In-Player Episode Preview Support";

    internal const string RuntimeScriptUrl = BaseAddOnUrl + "/altffour-tweaks-plugin-latest-min.js?v=20260312-33";
    internal const string UserThemeSelectorScriptUrl = BaseAddOnUrl + "/altffour-user-theme-selector.js?v=20260310-25";
    internal const string MediaBarSupportCssUrl = BaseAddOnUrl + "/media-bar-plugin-support-latest-min.css?v=20260312-15";
    internal const string InPlayerEpisodePreviewSupportCssUrl = BaseAddOnUrl + "/altffour-in-player-episode-preview-support-latest-min.css?v=20260312-15";

    public static InjectorSyncResult Synchronize(IApplicationPaths applicationPaths, PluginConfiguration configuration, ILogger? logger)
    {
        var actions = new List<string>();
        var result = new InjectorSyncResult();

        try
        {
            var configPath = Path.Combine(applicationPaths.PluginConfigurationsPath, JavaScriptInjectorConfigFile);
            result.ConfigPath = configPath;
            result.ConfigFound = File.Exists(configPath);

            if (!result.ConfigFound)
            {
                result.Summary = "JavaScript Injector config file was not found.";
                actions.Add("JavaScript Injector config file missing.");
                result.Actions = actions.ToArray();
                logger?.LogWarning(
                    "JavaScript Injector config not found at {ConfigPath}. Install JavaScript Injector to enable Altffour tweaks.",
                    configPath);
                return result;
            }

            var document = XDocument.Load(configPath, LoadOptions.PreserveWhitespace);
            var root = document.Root;
            if (root is null)
            {
                result.Success = false;
                result.Summary = "JavaScript Injector config file is malformed.";
                actions.Add("Root element missing in JavaScript Injector config.");
                result.Actions = actions.ToArray();
                logger?.LogWarning("JavaScript Injector config file is malformed at {ConfigPath}.", configPath);
                return result;
            }

            var changed = false;
            var (customJavaScripts, customScriptsCreated) = EnsureElement(root, "CustomJavaScripts");
            if (customScriptsCreated)
            {
                changed = true;
                actions.Add("Created CustomJavaScripts container.");
            }

            changed |= EnsureScriptEntry(
                customJavaScripts,
                RuntimeEntryName,
                BuildRuntimeLoaderScript(configuration),
                configuration.EnableTweaksLoader,
                actions);

            changed |= RemoveScriptEntry(customJavaScripts, UserThemeSelectorEntryName, actions);

            changed |= EnsureScriptEntry(
                customJavaScripts,
                MediaBarSupportEntryName,
                BuildStylesheetLoaderScript("altffour-media-bar-support-css", MediaBarSupportCssUrl),
                configuration.EnableMediaBarPluginSupport,
                actions);

            changed |= EnsureScriptEntry(
                customJavaScripts,
                InPlayerEpisodePreviewSupportEntryName,
                BuildStylesheetLoaderScript("altffour-in-player-episode-preview-support-css", InPlayerEpisodePreviewSupportCssUrl),
                configuration.EnableInPlayerEpisodePreviewSupport,
                actions);

            if (changed)
            {
                document.Save(configPath);
                actions.Add("Saved JavaScript Injector configuration.");
            }

            result.Changed = changed;
            result.Summary = changed
                ? "Self-heal applied updates to JavaScript Injector entries."
                : "Self-heal found all JavaScript Injector entries already healthy.";
            result.Actions = actions.ToArray();

            logger?.LogInformation("Altffour Tweaks Plugin synchronized JavaScript Injector entries. Changed={Changed}", changed);
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.Summary = "Self-heal failed while updating JavaScript Injector entries.";
            actions.Add(ex.Message);
            result.Actions = actions.ToArray();
            logger?.LogError(ex, "Altffour Tweaks Plugin failed to synchronize JavaScript Injector entries.");
        }

        return result;
    }

    private static string BuildRuntimeLoaderScript(PluginConfiguration configuration)
    {
        var enableDynamicHomeSpacer = configuration.EnableDynamicHomeSpacer ? "true" : "false";
        var enableExtraCardButtonsVisibility = configuration.EnableExtraCardButtonsVisibility ? "true" : "false";
        var themePalette = NormalizeThemePalette(configuration.ThemePalette);

        return $$"""
(() => {
  window.AltffourTweaksConfig = Object.assign({}, window.AltffourTweaksConfig || {}, {
    enableLatestShowsTitleLinkFix: false,
    enableSectionHeadingLinkFixes: false,
    enableDynamicHomeSpacer: {{enableDynamicHomeSpacer}},
    enableExtraCardButtonsVisibility: {{enableExtraCardButtonsVisibility}},
    themePalette: "{{themePalette}}",
    enableHomeRowDeduplication: false
  });

  const id = "altffour-tweaks-plugin-loader";
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = "{{RuntimeScriptUrl}}";
  script.defer = true;
  document.head.appendChild(script);
})();
""";
    }

    private static string NormalizeThemePalette(string? themePalette)
    {
        var normalized = (themePalette ?? string.Empty).Trim().ToLowerInvariant();

        return normalized switch
        {
            "ocean" => "ocean",
            "graphite" => "graphite",
            "emerald" => "emerald",
            "sunset" => "sunset",
            "crimson" => "crimson",
            _ => "ocean"
        };
    }

    private static string BuildStylesheetLoaderScript(string id, string href)
    {
        return $$"""
(() => {
  const id = "{{id}}";
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = "{{href}}";
  document.head.appendChild(link);
})();
""";
    }

    private static string BuildScriptLoaderScript(string id, string src)
    {
        return $$"""
(() => {
  const id = "{{id}}";
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.src = "{{src}}";
  script.defer = true;
  document.head.appendChild(script);
})();
""";
    }

    private static (XElement Element, bool Created) EnsureElement(XElement parent, string elementName)
    {
        var existing = parent.Elements().FirstOrDefault(e => e.Name.LocalName == elementName);
        if (existing is not null)
        {
            return (existing, false);
        }

        var created = new XElement(elementName);
        var pluginScripts = parent.Elements().FirstOrDefault(e => e.Name.LocalName == "PluginJavaScripts");
        if (pluginScripts is not null)
        {
            pluginScripts.AddBeforeSelf(created);
        }
        else
        {
            parent.Add(created);
        }

        return (created, true);
    }

    private static bool EnsureScriptEntry(XElement customJavaScripts, string name, string script, bool enabled, List<string> actions)
    {
        var changed = false;
        var scriptEntry = customJavaScripts
            .Elements()
            .FirstOrDefault(e =>
                e.Name.LocalName == "CustomJavaScriptEntry"
                && string.Equals(GetElementValue(e, "Name"), name, StringComparison.OrdinalIgnoreCase));

        if (scriptEntry is null)
        {
            scriptEntry = new XElement("CustomJavaScriptEntry");
            customJavaScripts.Add(scriptEntry);
            changed = true;
            actions.Add($"Created script entry: {name}");
        }

        changed |= SetElementValue(scriptEntry, "Name", name);
        changed |= SetElementCData(scriptEntry, "Script", script);
        changed |= SetElementValue(scriptEntry, "Enabled", enabled ? "true" : "false");
        changed |= SetElementValue(scriptEntry, "RequiresAuthentication", "false");

        return changed;
    }

    private static bool RemoveScriptEntry(XElement customJavaScripts, string name, List<string> actions)
    {
        var scriptEntry = customJavaScripts
            .Elements()
            .FirstOrDefault(e =>
                e.Name.LocalName == "CustomJavaScriptEntry"
                && string.Equals(GetElementValue(e, "Name"), name, StringComparison.OrdinalIgnoreCase));

        if (scriptEntry is null)
        {
            return false;
        }

        scriptEntry.Remove();
        actions.Add($"Removed script entry: {name}");
        return true;
    }

    private static string? GetElementValue(XElement parent, string elementName)
    {
        return parent.Elements().FirstOrDefault(e => e.Name.LocalName == elementName)?.Value;
    }

    private static bool SetElementValue(XElement parent, string elementName, string value)
    {
        var element = parent.Elements().FirstOrDefault(e => e.Name.LocalName == elementName);
        if (element is null)
        {
            parent.Add(new XElement(elementName, value));
            return true;
        }

        if (string.Equals(element.Value, value, StringComparison.Ordinal))
        {
            return false;
        }

        element.Value = value;
        return true;
    }

    private static bool SetElementCData(XElement parent, string elementName, string cdataValue)
    {
        var element = parent.Elements().FirstOrDefault(e => e.Name.LocalName == elementName);
        if (element is null)
        {
            parent.Add(new XElement(elementName, new XCData(cdataValue)));
            return true;
        }

        var currentValue = element.Value;
        if (string.Equals(currentValue, cdataValue, StringComparison.Ordinal))
        {
            return false;
        }

        element.ReplaceNodes(new XCData(cdataValue));
        return true;
    }
}
