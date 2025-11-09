import fs from 'node:fs/promises';
import path from 'node:path'

const buildAssetsDir = path.resolve('../build-assets');
const distDir = path.resolve('../dist');


// Copy files from build-assets/ to dist/
for(const entry of await fs.readdir(buildAssetsDir)) {
    const entryPath = path.join(buildAssetsDir, entry);
    const stat = await fs.stat(entryPath);
    if (!stat.isFile()) continue;
    const newEntryPath = path.join(distDir, entry);
    await fs.copyFile(entryPath, newEntryPath);
}


