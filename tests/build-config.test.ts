import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

function sourceFiles(): string[] {
  return readdirSync('src', { recursive: true, encoding: 'utf8' })
    .filter((file) => /\.tsx?$/.test(file))
    .map((file) => join('src', file));
}

describe('R11 · configuración del build', () => {
  it('el build no descarga fuentes de Google', () => {
    for (const file of sourceFiles()) {
      assert.doesNotMatch(readFileSync(file, 'utf8'), /from ['"]next\/font\/google['"]/, file);
    }
  });
});
