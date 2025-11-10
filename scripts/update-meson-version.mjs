import path from "node:path";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "node:url";

import semanticRelease from "semantic-release";
import { appendFile } from "node:fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 *
 * @param  {...unknown} error
 * @returns {never}
 */
function fail(...error) {
    console.error(...["❌", ...error]);
    process.exit(1);
}

/**
 *
 * @param {string} key
 * @param {unknown} value
 */
async function appendGithubOutput(key, value) {
    if (process.env.GITHUB_OUTPUT) {
        await appendFile(process.env.GITHUB_OUTPUT, `${key}=${value}\n`);
    }
}

async function run() {
    // do a semantic release dry run to capture the next version
    const result = await semanticRelease({
        dryRun: true,
        branches: ["master"],
        plugins: [
            "@semantic-release/commit-analyzer",
            "@semantic-release/release-notes-generator",
        ],
    });

    // No release required based on conventional commit history
    if (!result) {
        console.log("ℹ️ Nothing to release.");
        await appendGithubOutput("release_required", false);
        process.exit(0);
    }

    const version = result.nextRelease.version;

    await appendGithubOutput("release_required", true);
    await appendGithubOutput("next_version", version);

    const mesonPath = path.resolve(__dirname, "../meson.build");
    try {
        const content = await readFile(mesonPath, "utf8");

        const updated = content.replace(
            /(version\s*:\s*['"])([\d.]+)(['"])/,
            `$1${version}$3`
        );

        if (updated === content) {
            fail("Could not find a version field in meson.build to update.");
        }
        
        await writeFile(mesonPath, updated, "utf8");
        console.log(`✅ Updated meson.build version to ${version}`);
    } catch (error) {
        fail("Failed to update meson.build:", error);
    }
}

run();
