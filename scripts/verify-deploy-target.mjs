#!/usr/bin/env node
// B08: verificación previa al despliegue. Sale con código 1 si algún destino apunta al portal
// protegido o si no se puede determinar el destino. Solo lee configuración; no despliega nada.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// gcloud acepta tanto el ID como el número de proyecto.
const PROTECTED_PROJECTS = ['procurement-portal-app', '763056400659'];
const PROTECTED_SERVICE = 'ssrprocurementportalapp';
const PROJECT_ENV_VARS = ['GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'CLOUDSDK_CORE_PROJECT', 'FIREBASE_PROJECT'];

const problems = [];

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    problems.push(`no se pudo leer ${file}: ${error.message}`);
    return null;
  }
}

function checkProject(source, project) {
  if (PROTECTED_PROJECTS.includes(project)) problems.push(`${source} apunta al proyecto protegido ${project}`);
}

function explicitProject(args) {
  const index = args.indexOf('--project');
  if (index !== -1) return args[index + 1] ?? '';
  return args.find((arg) => arg.startsWith('--project='))?.slice('--project='.length) ?? null;
}

function activeGcloudProject() {
  try {
    const output = execFileSync('gcloud', ['config', 'get-value', 'project'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return output.trim();
  } catch {
    return null;
  }
}

const firebaserc = readJson('.firebaserc');
for (const [alias, project] of Object.entries(firebaserc?.projects ?? {})) {
  checkProject(`.firebaserc (${alias})`, project);
}

const firebaseJson = readJson('firebase.json');
if (firebaseJson) {
  const hostingConfigs = [firebaseJson.hosting ?? []].flat();
  for (const hosting of hostingConfigs) {
    // Sin site ni target, firebase deploy publica en el sitio por defecto del proyecto.
    if (!hosting.site && !hosting.target) {
      problems.push('firebase.json no nombra un site o target propio de Hosting');
    }
    for (const rewrite of hosting.rewrites ?? []) {
      // El servicio protegido existe como Cloud Run y como Function: se puede apuntar por ambas vías.
      const functionId = rewrite.function?.functionId ?? rewrite.function;
      if (rewrite.run?.serviceId === PROTECTED_SERVICE || functionId === PROTECTED_SERVICE) {
        problems.push(`firebase.json reescribe al servicio protegido ${PROTECTED_SERVICE}`);
      }
    }
  }
}

for (const name of PROJECT_ENV_VARS) {
  checkProject(`la variable ${name}`, process.env[name]);
}

const project = explicitProject(process.argv.slice(2));
if (project === '') {
  problems.push('--project no tiene valor');
} else if (project) {
  checkProject('--project', project);
} else {
  checkProject('el proyecto activo de gcloud', activeGcloudProject());
}

if (problems.length > 0) {
  console.error('DESPLIEGUE BLOQUEADO: no desplegar hasta definir servicio propio.');
  for (const problem of problems) console.error(`- ${problem}`);
  console.error('Ver DEPLOY.md.');
  process.exit(1);
}

console.log('Verificación previa correcta: ningún destino apunta al portal protegido.');
