/**
 * Runtime config loaded from /config.json (in dist).
 * Backend can edit dist/config.json to change API base URL without rebuilding.
 * Single source of truth: config.json
 */

const DEFAULT_API_BASE = "/job-referral-api";

let apiBaseUrl = DEFAULT_API_BASE;
let uploadHubUrl: string | null = null;
let downloadHubUrl: string | null = null;
let basePath = "/";

export function getApiBaseUrl(): string {
    return apiBaseUrl;
}

/** Base path for router (e.g. /AuthSignaturesUI). Use "/" for root. */
export function getBasePath(): string {
    return basePath;
}

/** Base URL without /api (for SignalR hub). */
export function getApiOrigin(): string {
    const base = apiBaseUrl;
    if (base.endsWith("/api")) return base.slice(0, -4);
    return base.replace(/\/api\/?$/, "");
}

export function getUploadHubUrl(): string {
    if (uploadHubUrl) return uploadHubUrl;
    return `${getApiOrigin()}/uploadHub`;
}

export function getDownloadHubUrl(): string {
    if (downloadHubUrl) return downloadHubUrl;
    return `${getApiOrigin()}/downloadHub`;
}

/**
 * Load config from /config.json. Call before app bootstrap.
 * Falls back to default if fetch fails.
 */
export async function loadConfig(): Promise<void> {
    try {
        const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
        const res = await fetch(`${base}config.json`, {
            cache: "no-store",
            headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
            const cfg = (await res.json()) as {
                apiBase?: string;
                uploadHub?: string;
                downloadHub?: string;
                basePath?: string;
            };
            if (cfg.apiBase && typeof cfg.apiBase === "string") {
                apiBaseUrl = cfg.apiBase.trim().replace(/\/$/, "");
            }
            if (cfg.uploadHub && typeof cfg.uploadHub === "string") {
                uploadHubUrl = cfg.uploadHub.trim().replace(/\/$/, "");
            }
            if (cfg.downloadHub && typeof cfg.downloadHub === "string") {
                downloadHubUrl = cfg.downloadHub.trim().replace(/\/$/, "");
            }
            if (cfg.basePath !== undefined && typeof cfg.basePath === "string") {
                const p = cfg.basePath.trim();
                basePath = p === "" || p === "/" ? "/" : `/${p.replace(/^\/+|\/+$/g, "")}`;
                // If we're not under the configured path (e.g. local dev at /), use root
                if (typeof window !== "undefined" && basePath !== "/") {
                    const pathname = window.location.pathname;
                    if (!pathname.startsWith(basePath)) basePath = "/";
                }
            }
        }
    } catch {
        // Keep default
    }
}
