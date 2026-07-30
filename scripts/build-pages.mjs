import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const cwd = process.cwd();
const apiDir = path.join(cwd, 'app', 'api');
const backupApiDir = path.join(cwd, 'app', '__api_local_only__');

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

function runNextBuild() {
  return new Promise((resolve, reject) => {
    const nextBin = path.join(cwd, 'node_modules', 'next', 'dist', 'bin', 'next');
    const child = spawn(process.execPath, [nextBin, 'build'], {
      cwd,
      stdio: 'inherit',
      env: {
        ...process.env,
        GITHUB_PAGES: 'true',
        NEXT_PUBLIC_STATIC_MODE: 'true',
      },
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`next build exited with code ${code}`));
    });
  });
}

async function writeNoJekyll() {
  const outDir = path.join(cwd, 'out');
  const noJekyllPath = path.join(outDir, '.nojekyll');
  await fs.writeFile(noJekyllPath, '');
}

async function main() {
  let movedApi = false;

  try {
    if (await pathExists(backupApiDir)) {
      await fs.rm(backupApiDir, { recursive: true, force: true });
    }

    if (await pathExists(apiDir)) {
      await fs.rename(apiDir, backupApiDir);
      movedApi = true;
      console.log('Temporarily moved app/api for static Pages build.');
    }

    await runNextBuild();
    await writeNoJekyll();
    console.log('GitHub Pages static build complete (out/).');
  } finally {
    if (movedApi) {
      if (await pathExists(apiDir)) {
        await fs.rm(apiDir, { recursive: true, force: true });
      }
      await fs.rename(backupApiDir, apiDir);
      console.log('Restored app/api after Pages build.');
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
