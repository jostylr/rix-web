import { PluginCatalog, lintRix, readPluginHeader } from "../../rix/src/index.js";

function leadingPluginMetadata(source, file) {
    if (!/^\s*\/\*{2,}/.test(source)) return null;
    const raw = readPluginHeader(source, file);
    return new PluginCatalog().addMetadata(raw, {
        sourcePath: file,
        source,
        kind: raw.kind || "rix",
    });
}

function contractDiagnostic(error, file) {
    return {
        code: "RX1901",
        severity: "error",
        title: "Plugin header contract",
        message: error instanceof Error ? error.message : String(error),
        hint: "Begin plugin source with a valid /** YAML header **/ contract.",
        file,
        line: 1,
        column: 1,
        offset: 0,
        level: 1,
    };
}

/** Run the production RiX analyzer with browser-safe plugin-header validation. */
export function lintTutorialSource(source, options = {}) {
    const file = options.file || "tutorial-cell.rix";
    let pluginMetadata = null;
    try {
        pluginMetadata = leadingPluginMetadata(String(source), file);
    } catch (error) {
        return [contractDiagnostic(error, file)];
    }
    try {
        return lintRix(String(source), {
            file,
            level: options.level || "pedantic",
            profile: options.profile || (pluginMetadata ? "plugin" : "all"),
            pluginMetadata,
        });
    } catch (error) {
        return [{
            code: "RX0001",
            severity: "error",
            title: "Source could not be analyzed",
            message: error instanceof Error ? error.message : String(error),
            hint: "Fix the parse error, then lint the cell again.",
            file,
            line: error?.line || 1,
            column: error?.column || 1,
            offset: error?.pos || 0,
            level: 1,
        }];
    }
}
