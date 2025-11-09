import { readFile, writeFile } from "fs/promises";

/**
 *
 * @param {import('semantic-release').GlobalConfig} config
 */
export async function prepare(config) {
    const version = config.nextRelease.version;

    await updateMesonProjectVersion(version);
}

/**
 * @param {string} version
 */
async function updateMesonProjectVersion(version) {
    const mesonPath = "../meson.build";
    try {
        const content = await readFile(mesonPath, "utf8");

        const updated = content.replace(
            /(version\s*:\s*['"])([\d.]+)(['"])/,
            `$1${version}$3`
        );

        if (updated === content) {
            console.warn(
                "⚠️ Could not find a version: field in meson.build to update."
            );
        } else {
            await writeFile(mesonPath, updated, "utf8");
            console.log(`✅ Updated meson.build version to ${version}`);
        }
    } catch (error) {
        console.error("❌ Failed to update meson.build:", error);
        process.exit(1);
    }
}
