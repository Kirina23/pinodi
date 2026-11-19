// Tiny test helper: no Jest needed, run with `tsx`.
import assert from 'node:assert/strict';
let failed = 0;
let passed = 0;
export function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
  } catch (e) {
    failed++;
    console.error(`✗ ${name}\n  ${(e as Error).message.split('\n').join('\n  ')}`);
  }
}
export function done(file: string) {
  console.log(`${failed ? '✗' : '✓'} ${file}: ${passed} passed${failed ? `, ${failed} failed` : ''}`);
  if (failed) process.exit(1);
}
export { assert };
