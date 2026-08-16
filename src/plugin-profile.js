import standardProfileSource from "../standard-profile.rix" with { type: "text" };

export const RIX_WEB_PROFILE_NAME = "standard-v1";
export const RIX_WEB_PROFILE_BEGIN = `## RIX-WEB-PROFILE-BEGIN ${RIX_WEB_PROFILE_NAME}`;
export const RIX_WEB_PROFILE_END = "## RIX-WEB-PROFILE-END";

function commaValues(values) {
    return values
        .flatMap((value) => String(value).split(","))
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
}

function profileEntries(source = standardProfileSource) {
    const entries = [];
    for (const rawLine of String(source).replace(/\r/g, "").split("\n")) {
        const line = rawLine.trim();
        if (!line || line.startsWith("##")) continue;
        const match = line.match(/^\.Plugin\.Load\("([^"]+)"\)/);
        if (!match) throw new Error(`Invalid RiX-Web profile line: ${line}`);
        entries.push({ id: match[1].toLowerCase(), source: line });
    }
    return entries;
}

export const STANDARD_PLUGIN_IDS = Object.freeze(profileEntries().map(({ id }) => id));

/** Parse URL overrides without depending on browser globals. */
export function pluginProfileFromUrl(input = "") {
    const url = input instanceof URL ? input : new URL(String(input || "http://localhost/"), "http://localhost/");
    const modes = commaValues(url.searchParams.getAll("plugins"));
    return {
        fresh: modes.includes("fresh"),
        add: commaValues(url.searchParams.getAll("plugins-add")),
        remove: commaValues(url.searchParams.getAll("plugins-remove")),
    };
}

function normalizedSavedProfile(profile) {
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) return null;
    if (!Array.isArray(profile.plugins) || typeof profile.source !== "string") return null;
    return {
        name: typeof profile.name === "string" ? profile.name : "saved",
        plugins: commaValues(profile.plugins),
        source: profile.source.trim(),
        warnings: [],
    };
}

/** Resolve the checked-in profile, URL overrides, or a profile saved in a session. */
export function resolvePluginProfile(profile = {}, availablePluginIds = []) {
    const saved = normalizedSavedProfile(profile);
    if (saved) return saved;

    const available = new Set(Array.from(availablePluginIds, (id) => String(id).toLowerCase()));
    const standard = profile?.fresh ? [] : profileEntries();
    const removed = new Set(commaValues(profile?.remove || []));
    const selected = standard.filter(({ id }) => !removed.has(id));
    const selectedIds = new Set(selected.map(({ id }) => id));
    const warnings = [];

    for (const id of commaValues(profile?.add || [])) {
        if (selectedIds.has(id)) continue;
        if (available.size && !available.has(id)) {
            warnings.push(`Unknown RiX-Web plugin '${id}' was ignored.`);
            continue;
        }
        selected.push({ id, source: `.Plugin.Load(${JSON.stringify(id)});` });
        selectedIds.add(id);
    }

    return {
        name: profile?.fresh ? "fresh" : RIX_WEB_PROFILE_NAME,
        plugins: selected.map(({ id }) => id),
        source: selected.map(({ source }) => source).join("\n"),
        warnings,
    };
}

/** Mark generated preload code so RiX-Web hosts may strip it after applying the profile. */
export function markedPluginProfileSource(profile) {
    const source = String(profile?.source || "").trim();
    const name = String(profile?.name || RIX_WEB_PROFILE_NAME).trim();
    return source ? `## RIX-WEB-PROFILE-BEGIN ${name}\n${source}\n${RIX_WEB_PROFILE_END}` : "";
}

export function markedPluginProfile(source) {
    const match = String(source).match(/(?:^|\n)## RIX-WEB-PROFILE-BEGIN ([^\n]+)\n([\s\S]*?)\n## RIX-WEB-PROFILE-END(?=\n|$)/);
    return match ? { name: match[1].trim(), source: match[2].trim(), matchedSource: match[0] } : null;
}

export function stripMarkedPluginProfile(source, expectedProfileSource = null) {
    const marked = markedPluginProfile(source);
    if (!marked) return String(source);
    if (expectedProfileSource !== null && marked.source !== String(expectedProfileSource).trim()) return String(source);
    return String(source).replace(marked.matchedSource, "\n").replace(/^\s+/, "");
}
