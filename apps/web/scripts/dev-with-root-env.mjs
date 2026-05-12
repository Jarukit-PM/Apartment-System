/**
 * Runs `next` with selected keys from the monorepo root `.env` merged into
 * `process.env` before the Next process starts. Keeps server secrets out of
 * `next.config` (avoids restart loops) and avoids `fs` inside `instrumentation`
 * (avoids webpack bundling errors).
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(webRoot, "..", "..");

const allow = new Set(["API_URL", "NEXT_PUBLIC_API_URL", "JWT_SECRET"]);

function mergeSelectedKeysFromRootEnv() {
  const envPath = path.join(repoRoot, ".env");
  let raw;
  try {
    raw = fs.readFileSync(envPath, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const key = t.slice(0, eq).trim();
    if (!allow.has(key) || process.env[key] !== undefined) continue;
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

mergeSelectedKeysFromRootEnv();

const nextArgs = process.argv.slice(2);
if (nextArgs.length === 0) {
  console.error("usage: node dev-with-root-env.mjs <next-args…>");
  process.exit(1);
}

const nextBin = path.join(webRoot, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, ...nextArgs], {
  cwd: webRoot,
  stdio: "inherit",
  env: process.env,
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
