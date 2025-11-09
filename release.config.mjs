/** @type {Partial<import('semantic-release').GlobalConfig>} */
export default {
    branches: ["main"],
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/changelog",
        ["./scripts/update-meson-version.mjs", null], // ✅ correct custom plugin syntax
        [
            "@semantic-release/git",
            {
                assets: ["package.json", "CHANGELOG.md", "meson.build"],
                message:
                    "chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}",
            },
        ],
        [
            "@semantic-release/github",
            {
                assets: ["io.github.devklick.noted.flatpak"],
            },
        ],
    ],
};
