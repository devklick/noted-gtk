import fs from 'node:fs/promises';
import path from 'node:path'
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const buildAssetsDir = path.join(__dirname, 'build-assets');
const distDir = path.join(__dirname, 'dist');


// Copy files from build-assets/ to dist/
for(const entry of await fs.readdir(buildAssetsDir)) {
    const entryPath = path.join(buildAssetsDir, entry);
    const stat = await fs.stat(entryPath);
    if (!stat.isFile()) continue;
    const newEntryPath = path.join(distDir, entry);
    await fs.copyFile(entryPath, newEntryPath);
}


