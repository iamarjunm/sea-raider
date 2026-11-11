import { cp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const sourceRoot = path.resolve(process.env.NEXT_DIST_DIR || 'out');
const outputRoot = path.resolve('out');
try {
  if (!(await stat(sourceRoot)).isDirectory()) throw new Error('static export output is not a directory');
} catch {
  throw new Error('Next.js did not create its static export directory.');
}
if (sourceRoot !== outputRoot) {
  if (outputRoot !== path.resolve('out')) throw new Error('Refusing to replace an unexpected export directory.');
  await rm(outputRoot, { recursive: true, force: true });
  await cp(sourceRoot, outputRoot, { recursive: true, force: true });
}

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(filePath);
      continue;
    }
    if (!/\.(html|js|css)$/i.test(entry.name)) continue;
    let content = await readFile(filePath, 'utf8');
    if (/\.css$/i.test(entry.name)) {
      // Exported stylesheets live under out/_next/static/css, three levels below the game root.
      content = content.replace(/url\((['"]?)\/(assets|_next)\//g, 'url($1../../../$2/');
    } else {
      // Engine hosts each front version in a nested URL directory, so root-relative URLs would escape it.
      content = content.replace(/(["'`])\/(assets|_next)\//g, '$1./$2/');
    }
    await writeFile(filePath, content, 'utf8');
  }
}

await visit(outputRoot);

// Public assets are copied wholesale by Next.js. Keep the source art intact,
// but remove unused Studio artwork from the upload export to reduce download size.
const artRoot = path.join(outputRoot, 'assets', 'aistudio');
try {
  if ((await stat(artRoot)).isDirectory()) {
    const referenced = new Set();
    let totalBefore = 0;
    const exportReferences = /assets\/aistudio\/([A-Za-z0-9._-]+)/g;

    async function collectReferences(directory) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const filePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          await collectReferences(filePath);
          continue;
        }
        if (!/\.(html|js|css)$/i.test(entry.name)) continue;
        const content = await readFile(filePath, 'utf8');
        for (const match of content.matchAll(exportReferences)) referenced.add(match[1]);
      }
    }

    await collectReferences(outputRoot);
    if (!referenced.size) throw new Error('No compiled Studio art references found; refusing to prune assets.');

    let removedCount = 0;
    for (const entry of await readdir(artRoot, { withFileTypes: true })) {
      const filePath = path.join(artRoot, entry.name);
      const fileStat = await stat(filePath);
      totalBefore += fileStat.size;
      if (entry.isFile() && !referenced.has(entry.name)) {
        await rm(filePath, { force: true });
        removedCount += 1;
      }
    }

    const remaining = await readdir(artRoot, { withFileTypes: true });
    let totalAfter = 0;
    for (const entry of remaining) totalAfter += (await stat(path.join(artRoot, entry.name))).size;
    const savedMb = ((totalBefore - totalAfter) / (1024 * 1024)).toFixed(1);
    console.log(`Trimmed ${removedCount} unused Studio art files from the export (saved ${savedMb} MB).`);
  }
} catch (error) {
  throw new Error(`Could not safely trim unused exported art: ${error instanceof Error ? error.message : String(error)}`);
}

console.log('Prepared static Engine export with version-relative asset URLs.');
