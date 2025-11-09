/**
 * @type {Partial<import('semantic-release').GlobalConfig>}
 */
export default {
    branches: ["master"],
    plugins: [
        "@semantic-release/commit-analyzer",
        "@semantic-release/release-notes-generator",
        "@semantic-release/changelog",
        [
            "@semantic-release/git",
            {
                assets: ["CHANGELOG.md", "package.json", "meson.build"],
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
    prepare: [
        {
            path: "./scripts/update-meson-version.js",
        },
    ],
};
