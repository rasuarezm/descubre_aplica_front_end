import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, describe, it } from 'node:test';

const SCRIPT = resolve('scripts/verify-deploy-target.mjs');
const PROTECTED_PROJECT = 'procurement-portal-app';
const PROTECTED_SERVICE = 'ssrprocurementportalapp';

const fixtures: string[] = [];

function fixture(project: string, serviceId: string, hosting: Record<string, unknown> = { site: 'bidtory-portal' }): string {
  const dir = mkdtempSync(join(tmpdir(), 'deploy-target-'));
  fixtures.push(dir);
  writeFileSync(join(dir, '.firebaserc'), JSON.stringify({ projects: { default: project } }));
  writeFileSync(
    join(dir, 'firebase.json'),
    JSON.stringify({ hosting: { rewrites: [{ source: '**', run: { serviceId, region: 'us-central1' } }], ...hosting } })
  );
  return dir;
}

function verify(cwd: string, args: string[], env: Record<string, string> = {}) {
  const { GOOGLE_CLOUD_PROJECT, GCLOUD_PROJECT, CLOUDSDK_CORE_PROJECT, FIREBASE_PROJECT, ...baseEnv } = process.env;
  return spawnSync(process.execPath, [SCRIPT, ...args], { cwd, encoding: 'utf8', env: { ...baseEnv, ...env } });
}

after(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

describe('B08 · verificación previa al despliegue', () => {
  it('bloquea el repositorio en su estado actual', () => {
    const result = verify(process.cwd(), ['--project', 'bidtory-nuevo']);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /no desplegar hasta definir servicio propio/);
    assert.match(result.stderr, /\.firebaserc/);
    assert.match(result.stderr, /firebase\.json/);
  });

  it('acepta un proyecto y un servicio propios', () => {
    const result = verify(fixture('bidtory-nuevo', 'bidtory-portal'), ['--project', 'bidtory-nuevo']);

    assert.equal(result.status, 0, result.stderr);
  });

  it('rechaza el proyecto protegido en .firebaserc', () => {
    const result = verify(fixture(PROTECTED_PROJECT, 'bidtory-portal'), ['--project', 'bidtory-nuevo']);

    assert.equal(result.status, 1);
  });

  it('rechaza el servicio protegido en firebase.json', () => {
    const result = verify(fixture('bidtory-nuevo', PROTECTED_SERVICE), ['--project', 'bidtory-nuevo']);

    assert.equal(result.status, 1);
  });

  it('rechaza el proyecto protegido por argumento, en ambas formas', () => {
    const dir = fixture('bidtory-nuevo', 'bidtory-portal');

    assert.equal(verify(dir, ['--project', PROTECTED_PROJECT]).status, 1);
    assert.equal(verify(dir, [`--project=${PROTECTED_PROJECT}`]).status, 1);
  });

  it('rechaza el proyecto protegido por su número', () => {
    const dir = fixture('bidtory-nuevo', 'bidtory-portal');

    assert.equal(verify(dir, ['--project', '763056400659']).status, 1);
  });

  it('rechaza el servicio protegido cuando se apunta como Function', () => {
    const asString = { rewrites: [{ source: '**', function: PROTECTED_SERVICE }] };
    const asObject = { rewrites: [{ source: '**', function: { functionId: PROTECTED_SERVICE } }] };

    assert.equal(verify(fixture('bidtory-nuevo', 'bidtory-portal', asString), ['--project', 'bidtory-nuevo']).status, 1);
    assert.equal(verify(fixture('bidtory-nuevo', 'bidtory-portal', asObject), ['--project', 'bidtory-nuevo']).status, 1);
  });

  it('rechaza publicar en el sitio por defecto aunque el proyecto sea otro', () => {
    const result = verify(fixture('bidtory-nuevo', 'bidtory-portal', { site: undefined }), ['--project', 'bidtory-nuevo']);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /site o target/);
  });

  it('acepta un target de Hosting en lugar de site', () => {
    const dir = fixture('bidtory-nuevo', 'bidtory-portal', { site: undefined, target: 'portal' });

    assert.equal(verify(dir, ['--project', 'bidtory-nuevo']).status, 0);
  });

  it('rechaza el proyecto protegido por variable de entorno', () => {
    const dir = fixture('bidtory-nuevo', 'bidtory-portal');

    assert.equal(verify(dir, ['--project', 'bidtory-nuevo'], { CLOUDSDK_CORE_PROJECT: PROTECTED_PROJECT }).status, 1);
  });

  it('falla cerrado si no puede leer la configuración', () => {
    const dir = fixture('bidtory-nuevo', 'bidtory-portal');
    writeFileSync(join(dir, '.firebaserc'), '{ roto');

    assert.equal(verify(dir, ['--project', 'bidtory-nuevo']).status, 1);
  });
});
