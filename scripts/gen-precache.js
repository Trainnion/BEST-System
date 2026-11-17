/**
 * BEST - Precache manifest generator (WP-09, plan Sec. 7.3).
 *
 * Runs as `postbuild` after `next build`. Reads the Next build manifests
 * under .next/ (build-manifest.json and app-build-manifest.json), collects
 * the shell routes that actually exist under src/app plus every static
 * chunk/font they need, and writes public/precache-manifest.json as:
 *
 *   { build_id, files, routes, generated_at }
 *
 * A route whose page file does not exist yet (e.g. /id-card, /blotter,
 * /services/business-clearance on a fresh checkout) is simply skipped, and
 * a build without .next (fresh checkout) writes a minimal valid manifest.
 * This script NEVER throws and always exits 0.
 */

import { existsSync } from 'node:fs';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

/** Shell routes of the offline experience (plan Sec. 7.3) with their page
 *  file paths under src/app. */
const SHELL_CANDIDATES = [
  ['/', ['page.jsx', 'page.js']],
  ['/offline', ['offline/page.jsx', 'offline/page.js']],
  ['/track', ['track/page.jsx', 'track/page.js']],
  ['/blotter', ['blotter/page.jsx', 'blotter/page.js']],
  ['/blotter/track', ['blotter/track/page.jsx', 'blotter/track/page.js']],
  ['/directory', ['directory/page.jsx', 'directory/page.js']],
  ['/broadcasts', ['broadcasts/page.jsx', 'broadcasts/page.js']],
  ['/id-card', ['id-card/page.jsx', 'id-card/page.js']],
  ['/services/request', ['services/request/page.jsx', 'services/request/page.js']],
  ['/services/business-clearance', ['services/business-clearance/page.jsx', 'services/business-clearance/page.js']],
  ['/services/kaagapay', ['services/kaagapay/page.jsx', 'services/kaagapay/page.js']],
];

/** Recursively list files under a directory (returns [] when missing). */
async function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  const entries = await readdir(dir, { withFileTypes: true, recursive: false });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(full)));
    } else if (entry.isFile()) {
      out.push(full);
    }
  }
  return out;
}

/** Collect static asset URLs from one Next manifest object. */
function collectFromManifest(manifest) {
  const urls = new Set();
  if (!manifest || typeof manifest !== 'object') return urls;
  const groups = [];
  if (manifest.pages && typeof manifest.pages === 'object') groups.push(manifest.pages);
  if (manifest.devFiles && typeof manifest.devFiles === 'object') groups.push(manifest.devFiles);
  for (const group of groups) {
    for (const list of Object.values(group)) {
      if (!Array.isArray(list)) continue;
      for (const raw of list) {
        const url = String(raw);
        if (!url) continue;
        urls.add(url.startsWith('/') ? url : `/_next/${url}`);
      }
    }
  }
  return urls;
}

async function main() {
  const root = process.cwd();
  const appDir = path.join(root, 'src', 'app');
  const nextDir = path.join(root, '.next');
  const publicDir = path.join(root, 'public');
  const outFile = path.join(publicDir, 'precache-manifest.json');

  const files = new Set();
  const routes = [];

  // 1) Shell routes that actually exist as page files under src/app.
  for (const [route, candidates] of SHELL_CANDIDATES) {
    const pageExists = candidates.some((file) =>
      existsSync(path.join(appDir, file)),
    );
    if (pageExists) routes.push(route);
  }

  // 2) Static chunks and CSS from the Next build manifests.
  if (existsSync(nextDir)) {
    for (const name of ['build-manifest.json', 'app-build-manifest.json']) {
      try {
        const raw = await readFile(path.join(nextDir, name), 'utf8');
        for (const url of collectFromManifest(JSON.parse(raw))) {
          files.add(url);
        }
      } catch {
        // A missing or unreadable manifest is not fatal.
      }
    }

    // 3) Self-hosted fonts the build emits (.woff2 under .next/static).
    for (const file of await walk(path.join(nextDir, 'static'))) {
      if (file.endsWith('.woff2')) {
        const rel = path.relative(nextDir, file).split(path.sep).join('/');
        files.add(`/_next/${rel}`);
      }
    }
  }

  // 4) App-owned public assets: icons and the web manifest.
  for (const file of await walk(path.join(publicDir, 'icons'))) {
    files.add(`/icons/${path.basename(file)}`);
  }
  if (existsSync(path.join(publicDir, 'manifest.webmanifest'))) {
    files.add('/manifest.webmanifest');
  }

  // 5) Build id: the real Next BUILD_ID, or a deterministic dev fallback.
  let buildId = '';
  try {
    buildId = (await readFile(path.join(nextDir, 'BUILD_ID'), 'utf8')).trim();
  } catch {
    buildId = '';
  }
  const generatedAt = new Date().toISOString();
  if (!buildId) {
    const digest = createHash('sha256')
      .update(`${generatedAt}|${routes.join(',')}|${[...files].sort().join(',')}`)
      .digest('hex')
      .slice(0, 16);
    buildId = `dev-${digest}`;
  }

  const manifest = {
    build_id: buildId,
    files: [...files].sort(),
    routes: routes.sort(),
    generated_at: generatedAt,
  };

  await mkdir(publicDir, { recursive: true });
  await writeFile(outFile, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  process.stdout.write(
    `[gen-precache] wrote public/precache-manifest.json: ` +
      `${manifest.routes.length} routes, ${manifest.files.length} files ` +
      `(build ${manifest.build_id}).\n`,
  );
}

// Never throw on a fresh checkout (Sec. 7.3): fall back to a minimal
// valid manifest and exit 0 whatever happens.
try {
  await main();
} catch (error) {
  try {
    const publicDir = path.join(process.cwd(), 'public');
    await mkdir(publicDir, { recursive: true });
    const fallback = {
      build_id: `dev-${Date.now().toString(36)}`,
      files: [],
      routes: [],
      generated_at: new Date().toISOString(),
    };
    await writeFile(
      path.join(publicDir, 'precache-manifest.json'),
      `${JSON.stringify(fallback, null, 2)}\n`,
      'utf8',
    );
    process.stdout.write(
      `[gen-precache] WARNING: wrote a minimal manifest after an error: ` +
        `${error && error.message ? error.message : String(error)}\n`,
    );
  } catch {
    process.stdout.write('[gen-precache] WARNING: could not write even the minimal manifest.\n');
  }
  process.exitCode = 0;
}
