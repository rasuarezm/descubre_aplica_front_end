import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { after, describe, it } from 'node:test';

const SCRIPT = resolve('scripts/verify-deploy-target.mjs');
const PROTECTED_PROJECT = 'procurement-portal-app';
const PROTECTED_SERVICE = 'ssrprocurementportalapp';
const PROJECT = 'bidtory-nuevo';
const SERVICE = 'bidtory-portal';
const TARGET_ARGS = ['--project', PROJECT, '--service', SERVICE];
// Fixture del revisor (R10): .firebaserc sin proyectos y un gcloud que sale con error.
const REVIEWER_FIXTURE = resolve('tests/revision-codex/guard-no-project');
const FAILING_GCLOUD = join(REVIEWER_FIXTURE, 'bin');

const fixtures: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'deploy-target-'));
  fixtures.push(dir);
  return dir;
}

function gcloudPrinting(output: string): string {
  const dir = tempDir();
  writeFileSync(join(dir, 'gcloud'), `#!/bin/sh\necho '${output}'\n`, { mode: 0o755 });
  return dir;
}

const ACTIVE_GCLOUD = gcloudPrinting(PROJECT);

function fixture(project: string, serviceId: string, hosting: Record<string, unknown> = {}): string {
  const dir = tempDir();
  writeFileSync(join(dir, '.firebaserc'), JSON.stringify({ projects: { default: project } }));
  writeFileSync(
    join(dir, 'firebase.json'),
    JSON.stringify({
      hosting: { site: 'bidtory-portal', rewrites: [{ source: '**', run: { serviceId, region: 'us-central1' } }], ...hosting },
    })
  );
  return dir;
}

function withFirebaserc(rc: unknown, hosting?: Record<string, unknown>): string {
  const dir = fixture(PROJECT, SERVICE, hosting);
  writeFileSync(join(dir, '.firebaserc'), JSON.stringify(rc));
  return dir;
}

function withFirebaseJson(config: unknown): string {
  const dir = fixture(PROJECT, SERVICE);
  writeFileSync(join(dir, 'firebase.json'), JSON.stringify(config));
  return dir;
}

function verify(cwd: string, args: string[], env: Record<string, string> = {}, gcloudDir = ACTIVE_GCLOUD) {
  const { GOOGLE_CLOUD_PROJECT, GCLOUD_PROJECT, CLOUDSDK_CORE_PROJECT, FIREBASE_PROJECT, ...baseEnv } = process.env;
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd,
    encoding: 'utf8',
    env: { ...baseEnv, PATH: `${gcloudDir}:${baseEnv.PATH}`, ...env },
  });
}

function assertBlocked(result: ReturnType<typeof verify>, reason: RegExp) {
  assert.equal(result.status, 1, result.stdout);
  assert.doesNotMatch(result.stdout, /Verificación previa correcta/);
  assert.match(result.stderr, reason);
}

after(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

describe('B08 · verificación previa al despliegue', () => {
  it('bloquea el repositorio en su estado actual', () => {
    const result = verify(process.cwd(), TARGET_ARGS);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /no desplegar hasta definir servicio propio/);
    assert.match(result.stderr, /\.firebaserc/);
    assert.match(result.stderr, /firebase\.json/);
  });

  it('acepta un proyecto y un servicio propios', () => {
    const result = verify(fixture('bidtory-nuevo', 'bidtory-portal'), TARGET_ARGS);

    assert.equal(result.status, 0, result.stderr);
  });

  it('rechaza el proyecto protegido en .firebaserc', () => {
    const result = verify(fixture(PROTECTED_PROJECT, 'bidtory-portal'), TARGET_ARGS);

    assert.equal(result.status, 1);
  });

  it('rechaza el servicio protegido en firebase.json', () => {
    const result = verify(fixture('bidtory-nuevo', PROTECTED_SERVICE), TARGET_ARGS);

    assert.equal(result.status, 1);
  });

  it('rechaza el proyecto protegido por argumento, en ambas formas', () => {
    const dir = fixture('bidtory-nuevo', 'bidtory-portal');

    assert.equal(verify(dir, ['--project', PROTECTED_PROJECT, '--service', SERVICE]).status, 1);
    assert.equal(verify(dir, [`--project=${PROTECTED_PROJECT}`, '--service', SERVICE]).status, 1);
  });

  it('rechaza el proyecto protegido por su número', () => {
    const dir = fixture('bidtory-nuevo', 'bidtory-portal');

    assert.equal(verify(dir, ['--project', '763056400659', '--service', SERVICE]).status, 1);
  });

  it('rechaza el servicio protegido cuando se apunta como Function', () => {
    const asString = { rewrites: [{ source: '**', function: PROTECTED_SERVICE }] };
    const asObject = { rewrites: [{ source: '**', function: { functionId: PROTECTED_SERVICE } }] };

    assert.equal(verify(fixture('bidtory-nuevo', 'bidtory-portal', asString), TARGET_ARGS).status, 1);
    assert.equal(verify(fixture('bidtory-nuevo', 'bidtory-portal', asObject), TARGET_ARGS).status, 1);
  });

  it('rechaza publicar en el sitio por defecto aunque el proyecto sea otro', () => {
    const result = verify(fixture('bidtory-nuevo', 'bidtory-portal', { site: undefined }), TARGET_ARGS);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /site o target/);
  });

  it('acepta un target de Hosting en lugar de site', () => {
    const rc = { projects: { default: PROJECT }, targets: { [PROJECT]: { hosting: { portal: ['bidtory-portal-web'] } } } };
    const result = verify(withFirebaserc(rc, { site: undefined, target: 'portal' }), TARGET_ARGS);

    assert.equal(result.status, 0, result.stderr);
  });

  it('rechaza el proyecto protegido por variable de entorno', () => {
    const dir = fixture('bidtory-nuevo', 'bidtory-portal');

    assert.equal(verify(dir, TARGET_ARGS, { CLOUDSDK_CORE_PROJECT: PROTECTED_PROJECT }).status, 1);
  });

  it('falla cerrado si no puede leer la configuración', () => {
    const dir = fixture('bidtory-nuevo', 'bidtory-portal');
    writeFileSync(join(dir, '.firebaserc'), '{ roto');

    assert.equal(verify(dir, TARGET_ARGS).status, 1);
  });
});

describe('R10 · la verificación falla cerrada', () => {
  describe('fixture del revisor', () => {
    it('rechaza .firebaserc sin proyectos, sin --project y con gcloud en error', () => {
      const result = verify(REVIEWER_FIXTURE, [], {}, FAILING_GCLOUD);

      assertBlocked(result, /--project/);
      assert.match(result.stderr, /\.firebaserc/);
      assert.match(result.stderr, /gcloud/);
    });

    it('sigue rechazándolo aunque se declare el destino por argumento', () => {
      const result = verify(REVIEWER_FIXTURE, ['--project', 'portal-own', '--service', 'portal-own'], {}, FAILING_GCLOUD);

      assertBlocked(result, /\.firebaserc no declara proyectos/);
    });
  });

  describe('proyecto', () => {
    it('rechaza que falte --project aunque el resto coincida', () => {
      assertBlocked(verify(fixture(PROJECT, SERVICE), ['--service', SERVICE]), /falta --project/);
    });

    it('rechaza --project vacío o sin valor', () => {
      const dir = fixture(PROJECT, SERVICE);

      assertBlocked(verify(dir, ['--project=', '--service', SERVICE]), /falta --project/);
      assertBlocked(verify(dir, ['--service', SERVICE, '--project']), /argumentos no válidos/);
      assertBlocked(verify(dir, ['--project', '--service', SERVICE]), /argumentos no válidos/);
    });

    it('rechaza un --project repetido, que dejaría el destino ambiguo', () => {
      const dir = fixture(PROJECT, SERVICE);

      assertBlocked(verify(dir, [...TARGET_ARGS, `--project=${PROTECTED_PROJECT}`]), /más de una vez/);
    });

    it('rechaza argumentos desconocidos', () => {
      assertBlocked(verify(fixture(PROJECT, SERVICE), [...TARGET_ARGS, '--proyecto', 'x']), /argumentos no válidos/);
    });

    it('rechaza una variable de proyecto que apunta a otro proyecto', () => {
      const result = verify(fixture(PROJECT, SERVICE), TARGET_ARGS, { FIREBASE_PROJECT: 'otro-proyecto' });

      assertBlocked(result, /FIREBASE_PROJECT/);
    });
  });

  describe('gcloud', () => {
    it('rechaza un error de gcloud aunque el destino esté completo', () => {
      assertBlocked(verify(fixture(PROJECT, SERVICE), TARGET_ARGS, {}, FAILING_GCLOUD), /no se pudo consultar gcloud/);
    });

    it('rechaza que gcloud no esté instalado', () => {
      const result = verify(fixture(PROJECT, SERVICE), TARGET_ARGS, { PATH: tempDir() });

      assertBlocked(result, /no se pudo consultar gcloud/);
    });

    it('rechaza un proyecto activo protegido aunque --project sea otro', () => {
      const result = verify(fixture(PROJECT, SERVICE), TARGET_ARGS, {}, gcloudPrinting(PROTECTED_PROJECT));

      assertBlocked(result, /proyecto activo de gcloud/);
    });

    it('rechaza un proyecto activo distinto del declarado', () => {
      const result = verify(fixture(PROJECT, SERVICE), TARGET_ARGS, {}, gcloudPrinting('otro-proyecto'));

      assertBlocked(result, /proyecto activo de gcloud/);
    });

    it('acepta que gcloud no tenga proyecto activo si --project lo determina', () => {
      for (const output of ['', '(unset)']) {
        const result = verify(fixture(PROJECT, SERVICE), TARGET_ARGS, {}, gcloudPrinting(output));

        assert.equal(result.status, 0, result.stderr);
      }
    });
  });

  describe('.firebaserc', () => {
    it('rechaza que no declare proyectos', () => {
      for (const rc of [{ projects: {} }, {}, null, { projects: ['bidtory-nuevo'] }]) {
        assertBlocked(verify(withFirebaserc(rc), TARGET_ARGS), /\.firebaserc no declara proyectos/);
      }
    });

    it('rechaza que falte el alias default o esté vacío', () => {
      for (const projects of [{ staging: PROJECT }, { default: '' }, { default: 42 }]) {
        assertBlocked(verify(withFirebaserc({ projects }), TARGET_ARGS), /\.firebaserc \(default\)/);
      }
    });

    it('rechaza un default distinto del proyecto declarado', () => {
      const result = verify(withFirebaserc({ projects: { default: 'otro-proyecto' } }), TARGET_ARGS);

      assertBlocked(result, /\.firebaserc \(default\)/);
    });

    it('rechaza un alias secundario protegido', () => {
      const result = verify(withFirebaserc({ projects: { default: PROJECT, viejo: PROTECTED_PROJECT } }), TARGET_ARGS);

      assertBlocked(result, /proyecto protegido/);
    });
  });

  describe('Hosting', () => {
    it('rechaza firebase.json sin configuración de Hosting', () => {
      for (const config of [{}, { hosting: [] }, null, []]) {
        assertBlocked(verify(withFirebaseJson(config), TARGET_ARGS), /no tiene configuración de Hosting/);
      }
    });

    it('rechaza una configuración de Hosting vacía', () => {
      assertBlocked(verify(withFirebaseJson({ hosting: {} }), TARGET_ARGS), /site o target/);
      assertBlocked(verify(withFirebaseJson({ hosting: [null] }), TARGET_ARGS), /site o target/);
    });

    it('rechaza un hosting.site vacío', () => {
      for (const site of ['', '   ', 42]) {
        assertBlocked(verify(fixture(PROJECT, SERVICE, { site }), TARGET_ARGS), /site o target/);
      }
    });

    it('rechaza nombrar el sitio por defecto del proyecto', () => {
      assertBlocked(verify(fixture(PROJECT, SERVICE, { site: PROJECT }), TARGET_ARGS), /sitio por defecto/);
    });

    it('rechaza site y target a la vez', () => {
      const result = verify(fixture(PROJECT, SERVICE, { site: 'bidtory-portal', target: 'portal' }), TARGET_ARGS);

      assertBlocked(result, /site y target/);
    });

    it('rechaza una entrada incompleta en una lista de Hosting', () => {
      const own = { site: 'bidtory-portal', rewrites: [{ source: '**', run: { serviceId: SERVICE } }] };

      assertBlocked(verify(withFirebaseJson({ hosting: [own, {}] }), TARGET_ARGS), /site o target/);
    });
  });

  describe('target de Hosting', () => {
    const hosting = { site: undefined, target: 'portal' };
    const rcWith = (targets: unknown) => ({ projects: { default: PROJECT }, targets });

    it('rechaza un target sin mapear', () => {
      assertBlocked(verify(withFirebaserc(rcWith(undefined), hosting), TARGET_ARGS), /target portal/);
    });

    it('rechaza un target mapeado solo en otro proyecto', () => {
      const targets = { 'otro-proyecto': { hosting: { portal: ['bidtory-portal-web'] } } };

      assertBlocked(verify(withFirebaserc(rcWith(targets), hosting), TARGET_ARGS), /target portal/);
    });

    it('rechaza un target mapeado a una lista vacía o con sitios vacíos', () => {
      for (const sites of [[], [''], 'bidtory-portal-web']) {
        const targets = { [PROJECT]: { hosting: { portal: sites } } };

        assertBlocked(verify(withFirebaserc(rcWith(targets), hosting), TARGET_ARGS), /target portal/);
      }
    });

    it('rechaza un target mapeado al sitio por defecto', () => {
      const targets = { [PROJECT]: { hosting: { portal: [PROJECT] } } };

      assertBlocked(verify(withFirebaserc(rcWith(targets), hosting), TARGET_ARGS), /sitio por defecto/);
    });
  });

  describe('servicio', () => {
    it('rechaza que falte --service aunque firebase.json nombre uno', () => {
      assertBlocked(verify(fixture(PROJECT, SERVICE), ['--project', PROJECT]), /falta --service/);
    });

    it('rechaza declarar el servicio protegido', () => {
      const result = verify(fixture(PROJECT, PROTECTED_SERVICE), ['--project', PROJECT, '--service', PROTECTED_SERVICE]);

      assertBlocked(result, /servicio protegido/);
    });

    it('rechaza un rewrite a un servicio no declarado', () => {
      assertBlocked(verify(fixture(PROJECT, 'otro-servicio'), TARGET_ARGS), /otro-servicio/);
    });

    it('rechaza un rewrite no declarado junto a uno correcto', () => {
      const rewrites = [
        { source: '/a', run: { serviceId: SERVICE } },
        { source: '/b', run: { serviceId: 'otro-servicio' } },
      ];

      assertBlocked(verify(fixture(PROJECT, SERVICE, { rewrites }), TARGET_ARGS), /otro-servicio/);
    });

    it('rechaza una Function no declarada, en ambas formas', () => {
      for (const target of ['otra-funcion', { functionId: 'otra-funcion' }]) {
        const rewrites = [{ source: '/a', run: { serviceId: SERVICE } }, { source: '/b', function: target }];

        assertBlocked(verify(fixture(PROJECT, SERVICE, { rewrites }), TARGET_ARGS), /otra-funcion/);
      }
    });

    it('rechaza una Function no declarada escondida en un rewrite con run', () => {
      const rewrites = [{ source: '**', run: { serviceId: SERVICE }, function: PROTECTED_SERVICE }];

      assertBlocked(verify(fixture(PROJECT, SERVICE, { rewrites }), TARGET_ARGS), /servicio protegido/);
    });

    it('rechaza un rewrite a Cloud Run sin serviceId', () => {
      const rewrites = [{ source: '**', run: { region: 'us-central1' } }];

      assertBlocked(verify(fixture(PROJECT, SERVICE, { rewrites }), TARGET_ARGS), /no es el servicio declarado/);
    });

    it('rechaza que ningún rewrite llegue al servicio declarado', () => {
      for (const rewrites of [[], undefined, {}, [{ source: '**', destination: '/index.html' }]]) {
        assertBlocked(verify(fixture(PROJECT, SERVICE, { rewrites }), TARGET_ARGS), /no reescribe tráfico al servicio/);
      }
    });

    it('acepta un rewrite estático junto al del servicio declarado', () => {
      const rewrites = [
        { source: '/legal', destination: '/legal.html' },
        { source: '**', run: { serviceId: SERVICE, region: 'us-central1' } },
      ];
      const result = verify(fixture(PROJECT, SERVICE, { rewrites }), TARGET_ARGS);

      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Verificación previa correcta/);
    });
  });
});
