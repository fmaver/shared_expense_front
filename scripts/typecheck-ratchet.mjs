/**
 * Fail when the number of TypeScript errors grows.
 *
 * Neither of the obvious commands checks types here: `vite build` transpiles with esbuild, and
 * tsconfig.json is references-only with "files": [], so `tsc --noEmit` inspects nothing and
 * exits 0. Only `tsc -b` really checks. That gap let a call to an undefined helper reach
 * production, where it threw at runtime and rendered an empty expense list.
 *
 * The repo carries pre-existing errors, so a strict gate would just be red forever. This
 * ratchet blocks *new* ones and lets the baseline be lowered as they are fixed — never raised.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const BASELINE_FILE = new URL('../.typecheck-baseline', import.meta.url);

let output = '';
try {
  output = execSync('npx tsc -b --noEmit', { encoding: 'utf8', stdio: 'pipe' });
} catch (err) {
  output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
}

const errors = output.split('\n').filter(line => /error TS\d+:/.test(line));
const count = errors.length;
const baseline = Number(readFileSync(BASELINE_FILE, 'utf8').trim());

if (count > baseline) {
  console.error(`\nTypeScript errors: ${count}, baseline ${baseline}. ${count - baseline} new.\n`);
  console.error(errors.slice(-40).join('\n'));
  console.error('\nFix them, or if you deliberately accept them, raise .typecheck-baseline.');
  process.exit(1);
}

if (count < baseline) {
  writeFileSync(BASELINE_FILE, `${count}\n`);
  console.log(`TypeScript errors down to ${count} (was ${baseline}). Baseline lowered — commit it.`);
} else {
  console.log(`TypeScript errors: ${count}, matching baseline.`);
}
