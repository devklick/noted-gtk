import path from 'node:path'
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 
 * @param {import('semantic-release').GlobalConfig} _config 
 * @param {import('semantic-release').PrepareContext} context 
 */
export async function prepare(_config, context) {
    const version = context.nextRelease.version;
    const mesonPath = path.resolve(__dirname, "../meson.build");
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
