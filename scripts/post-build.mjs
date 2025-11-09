import fs from 'node:fs/promises';
import path from 'node:path'
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildAssetsDir = path.resolve(__dirname, "../build-assets");
const distDir = path.resolve(__dirname, "../dist");


// Copy files from build-assets/ to dist/
for(const entry of await fs.readdir(buildAssetsDir)) {
    const entryPath = path.join(buildAssetsDir, entry);
    const stat = await fs.stat(entryPath);
    if (!stat.isFile()) continue;
    const newEntryPath = path.join(distDir, entry);
    await fs.copyFile(entryPath, newEntryPath);
}