using System.Net;
using System.Text.Json;
using MediaBrowser.Common.Configuration;
using Microsoft.Extensions.Logging;

namespace Altffour.Plugin.Tweaks;

internal static class PluginHealthEvaluator
{
    private const string JavaScriptInjectorGuid = "f5a34f7b-2e8a-4e6a-a722-3a216a81b374";

    public static void EvaluateAndPersist(
        IApplicationPaths applicationPaths,
        PluginConfiguration configuration,
        InjectorSyncResult syncResult,
        ILogger? logger)
    {
        try
        {
            var pluginMetas = LoadPluginMetas(applicationPaths.PluginsPath, logger);
            var jsInjector = FindPlugin(pluginMetas, JavaScriptInjectorGuid, "JavaScript Injector");
            var jsStatus = NormalizeStatus(jsInjector?.Status);

            configuration.JavaScriptInjectorInstalled = jsInjector is not null;
            configuration.JavaScriptInjectorActive = jsStatus == "active";
            configuration.JavaScriptInjectorStatus = jsStatus;
            configuration.JavaScriptInjectorConfigFound = syncResult.ConfigFound;

            configuration.LastSelfHealHadChanges = syncResult.Changed;
            configuration.LastSelfHealSummary = syncResult.Summary;
            configuration.LastSelfHealActions = syncResult.Actions;

            using var httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromSeconds(6)
            };

            var runtimeAsset = CheckUrl(httpClient, InjectorConfigSynchronizer.RuntimeScriptUrl);
            configuration.RuntimeAssetHealthy = runtimeAsset.Healthy;
            configuration.RuntimeAssetStatusCode = runtimeAsset.StatusCode;
            configuration.RuntimeAssetError = runtimeAsset.Error;

            var mediaBarAsset = CheckUrl(httpClient, InjectorConfigSynchronizer.MediaBarSupportCssUrl);
            configuration.MediaBarAssetHealthy = mediaBarAsset.Healthy;
            configuration.MediaBarAssetStatusCode = mediaBarAsset.StatusCode;
            configuration.MediaBarAssetError = mediaBarAsset.Error;

            var inPlayerAsset = CheckUrl(httpClient, InjectorConfigSynchronizer.InPlayerEpisodePreviewSupportCssUrl);
            configuration.InPlayerAssetHealthy = inPlayerAsset.Healthy;
            configuration.InPlayerAssetStatusCode = inPlayerAsset.StatusCode;
            configuration.InPlayerAssetError = inPlayerAsset.Error;

            configuration.ConflictWarnings = DetectConflicts(configuration, pluginMetas).ToArray();
            configuration.LastHealthCheckUtc = DateTime.UtcNow.ToString("O");

            Plugin.Instance?.SaveConfiguration(configuration);
            logger?.LogInformation("Altffour Tweaks Plugin health check completed. Conflicts={Count}", configuration.ConflictWarnings.Length);
        }
        catch (Exception ex)
        {
            logger?.LogError(ex, "Altffour Tweaks Plugin health check failed.");
        }
    }

    private static IEnumerable<string> DetectConflicts(PluginConfiguration configuration, IReadOnlyList<LocalPluginMeta> plugins)
    {
        var warnings = new List<string>();
        var mediaBar = FindPlugin(plugins, null, "Media Bar");
        var mediaBarEnhanced = FindPlugin(plugins, null, "Media Bar Enhanced");
        var homeScreenSections = FindPlugin(plugins, null, "Home Screen Sections");
        var inPlayerPreview = FindPlugin(plugins, null, "InPlayerEpisodePreview");

        var mediaBarActive = IsActiveOrRestart(mediaBar?.Status);
        var mediaBarEnhancedActive = IsActiveOrRestart(mediaBarEnhanced?.Status);
        var homeScreenSectionsActive = IsActiveOrRestart(homeScreenSections?.Status);
        var inPlayerPreviewActive = IsActiveOrRestart(inPlayerPreview?.Status);

        if (mediaBarActive && mediaBarEnhancedActive)
        {
            warnings.Add("Both Media Bar and Media Bar Enhanced are active. Their home overlays may conflict.");
        }

        if (configuration.EnableMediaBarPluginSupport && !mediaBarActive && !mediaBarEnhancedActive)
        {
            warnings.Add("Media Bar support CSS is enabled, but neither Media Bar nor Media Bar Enhanced is active.");
        }

        if (configuration.EnableInPlayerEpisodePreviewSupport && !inPlayerPreviewActive)
        {
            warnings.Add("In-Player Episode Preview support CSS is enabled, but InPlayerEpisodePreview is not active.");
        }

        if (configuration.EnableDynamicHomeSpacer && !mediaBarActive && !mediaBarEnhancedActive)
        {
            warnings.Add("Dynamic home spacer is enabled, but Media Bar or Media Bar Enhanced is not active.");
        }

        if ((configuration.EnableTweaksLoader
                || configuration.EnableDynamicHomeSpacer
                || configuration.EnableExtraCardButtonsVisibility
                || configuration.EnableMediaBarPluginSupport
                || configuration.EnableInPlayerEpisodePreviewSupport)
            && !configuration.JavaScriptInjectorActive)
        {
            warnings.Add("One or more injection toggles are enabled while JavaScript Injector is not active.");
        }

        if (!configuration.EnableTweaksLoader
            && (configuration.EnableDynamicHomeSpacer || configuration.EnableExtraCardButtonsVisibility))
        {
            warnings.Add("Runtime Injection is disabled while runtime-only fixes are enabled. Save settings to apply guardrails.");
        }

        if (!configuration.RuntimeAssetHealthy)
        {
            warnings.Add("Altffour runtime script URL is unreachable.");
        }

        return warnings;
    }

    private static LocalPluginMeta? FindPlugin(IReadOnlyList<LocalPluginMeta> plugins, string? guid, string? name)
    {
        var guidNorm = string.IsNullOrWhiteSpace(guid) ? null : guid.Trim().ToLowerInvariant();
        var nameNorm = string.IsNullOrWhiteSpace(name) ? null : name.Trim().ToLowerInvariant();

        return plugins.FirstOrDefault(plugin =>
        {
            var pluginGuid = (plugin.Guid ?? string.Empty).Trim().ToLowerInvariant();
            var pluginName = (plugin.Name ?? string.Empty).Trim().ToLowerInvariant();

            if (guidNorm is not null && pluginGuid == guidNorm)
            {
                return true;
            }

            return nameNorm is not null && pluginName == nameNorm;
        });
    }

    private static bool IsActiveOrRestart(string? status)
    {
        var normalized = NormalizeStatus(status);
        return normalized is "active" or "restart";
    }

    private static string NormalizeStatus(string? status)
    {
        return string.IsNullOrWhiteSpace(status)
            ? "unknown"
            : status.Trim().ToLowerInvariant();
    }

    private static IReadOnlyList<LocalPluginMeta> LoadPluginMetas(string pluginsPath, ILogger? logger)
    {
        var metas = new List<LocalPluginMeta>();
        if (string.IsNullOrWhiteSpace(pluginsPath) || !Directory.Exists(pluginsPath))
        {
            return metas;
        }

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        foreach (var directory in Directory.EnumerateDirectories(pluginsPath))
        {
            var metaPath = Path.Combine(directory, "meta.json");
            if (!File.Exists(metaPath))
            {
                continue;
            }

            try
            {
                var metaJson = File.ReadAllText(metaPath);
                var meta = JsonSerializer.Deserialize<LocalPluginMeta>(metaJson, jsonOptions);
                if (meta is not null)
                {
                    metas.Add(meta);
                }
            }
            catch (Exception ex)
            {
                logger?.LogWarning(ex, "Failed to parse plugin meta file at {MetaPath}", metaPath);
            }
        }

        return metas;
    }

    private static UrlCheckResult CheckUrl(HttpClient httpClient, string url)
    {
        try
        {
            using var headRequest = new HttpRequestMessage(HttpMethod.Head, url);
            using var headResponse = httpClient.Send(headRequest);

            if (headResponse.StatusCode == HttpStatusCode.MethodNotAllowed || headResponse.StatusCode == HttpStatusCode.NotImplemented)
            {
                using var getRequest = new HttpRequestMessage(HttpMethod.Get, url);
                using var getResponse = httpClient.Send(getRequest, HttpCompletionOption.ResponseHeadersRead);
                return FromResponse(getResponse);
            }

            return FromResponse(headResponse);
        }
        catch (Exception ex)
        {
            return new UrlCheckResult(false, 0, ex.Message);
        }
    }

    private static UrlCheckResult FromResponse(HttpResponseMessage response)
    {
        return new UrlCheckResult(
            response.IsSuccessStatusCode,
            (int)response.StatusCode,
            response.IsSuccessStatusCode ? string.Empty : response.ReasonPhrase ?? "Request failed");
    }

    private sealed record UrlCheckResult(bool Healthy, int StatusCode, string Error);

    private sealed class LocalPluginMeta
    {
        public string Guid { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Status { get; set; } = string.Empty;
    }
}
