import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const PUBLIC_VARIABLE = /NEXT_PUBLIC_[A-Z0-9_]+/g;

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

  it('la receta de DEPLOY.md y la plantilla cubren todas las variables públicas del código', () => {
    const used = new Set(sourceFiles().flatMap((file) => readFileSync(file, 'utf8').match(PUBLIC_VARIABLE) ?? []));
    const deploy = readFileSync('DEPLOY.md', 'utf8');
    const template = readFileSync('build-env.example.yaml', 'utf8');

    assert.ok(used.size > 0);
    for (const name of used) {
      assert.match(deploy, new RegExp(`\\| \`${name}\` \\|`), `${name} falta en DEPLOY.md`);
      assert.match(template, new RegExp(`^(# )?${name}: "`, 'm'), `${name} falta en build-env.example.yaml`);
    }
    for (const name of template.match(PUBLIC_VARIABLE) ?? []) {
      assert.ok(used.has(name), `${name} no tiene consumidor en src`);
    }
  });

  it('las obligatorias de DEPLOY.md son las activas en la plantilla', () => {
    const deploy = readFileSync('DEPLOY.md', 'utf8');
    const template = readFileSync('build-env.example.yaml', 'utf8');
    const required = [...deploy.matchAll(/^\| `(NEXT_PUBLIC_[A-Z0-9_]+)` \| Sí \|/gm)].map((match) => match[1]);
    const active = [...template.matchAll(/^(NEXT_PUBLIC_[A-Z0-9_]+): /gm)].map((match) => match[1]);

    assert.deepEqual(required.sort(), active.sort());
  });

  it('ninguna variable pública nombra un secreto', () => {
    for (const name of readFileSync('build-env.example.yaml', 'utf8').match(PUBLIC_VARIABLE) ?? []) {
      assert.doesNotMatch(name, /SECRET|PRIVATE|PASSWORD/);
    }
  });
});
