import { spawnSync } from 'node:child_process';
import path from 'node:path';

const env = { ...process.env, NEXT_DIST_DIR: '.next-engine-build' };
const nextCli = path.resolve('node_modules/next/dist/bin/next');
const result = spawnSync(process.execPath, [nextCli, 'build'], { stdio: 'inherit', env });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);

const prepared = spawnSync(process.execPath, [path.resolve('scripts/prepare-engine-export.mjs')], { stdio: 'inherit', env });
if (prepared.error) throw prepared.error;
if (prepared.status !== 0) process.exit(prepared.status || 1);
