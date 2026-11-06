#!/usr/bin/env node
// B08/R10: verificación previa al despliegue. Falla cerrado: sale con código 1 salvo que el destino sea
// completo, explícito, coherente y ajeno al portal protegido. Solo lee configuración; no despliega nada.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

// gcloud acepta tanto el ID como el número de proyecto.
const PROTECTED_PROJECTS = ['procurement-portal-app', '763056400659'];
const PROTECTED_SERVICE = 'ssrprocurementportalapp';
const PROJECT_ENV_VARS = ['GOOGLE_CLOUD_PROJECT', 'GCLOUD_PROJECT', 'CLOUDSDK_CORE_PROJECT', 'FIREBASE_PROJECT'];
const GCLOUD_TIMEOUT_MS = 30_000;

const problems = [];

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    problems.push(`no se pudo leer ${file}: ${error.message}`);
    return null;
  }
}

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function declaredTarget(args) {
  try {
    const { values } = parseArgs({
      args,
      options: { project: { type: 'string', multiple: true }, service: { type: 'string', multiple: true } },
    });
    return { project: singleValue(values, 'project'), service: singleValue(values, 'service') };
  } catch (error) {
    problems.push(`argumentos no válidos: ${error.message}`);
    return { project: null, service: null };
  }
}

function singleValue(values, name) {
  const [value, ...repeated] = values[name] ?? [];
  if (repeated.length > 0) problems.push(`--${name} aparece más de una vez`);
  if (hasText(value)) return value;
  problems.push(`falta --${name}: el destino debe declararse de forma explícita`);
  return null;
}

function checkProtected(source, project) {
  if (PROTECTED_PROJECTS.includes(project)) problems.push(`${source} apunta al proyecto protegido ${project}`);
}

function checkMatchesTarget(source, project) {
  if (PROTECTED_PROJECTS.includes(project)) {
    checkProtected(source, project);
  } else if (target.project && project !== target.project) {
    problems.push(`${source} apunta a ${project}, no al proyecto declarado ${target.project}`);
  }
}

function activeGcloudProject() {
  try {
    const output = execFileSync('gcloud', ['config', 'get-value', 'project'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: GCLOUD_TIMEOUT_MS,
    }).trim();
    return output === '(unset)' ? '' : output;
  } catch (error) {
    problems.push(`no se pudo consultar gcloud: ${error.message}`);
    return '';
  }
}

function checkFirebaserc(firebaserc) {
  const projects = firebaserc?.projects;
  if (!isRecord(projects) || Object.keys(projects).length === 0) {
    problems.push('.firebaserc no declara proyectos');
    return;
  }
  for (const [alias, project] of Object.entries(projects)) {
    if (alias !== 'default') checkProtected(`.firebaserc (${alias})`, project);
  }
  if (hasText(projects.default)) {
    checkMatchesTarget('.firebaserc (default)', projects.default);
  } else {
    problems.push('.firebaserc (default) no nombra un proyecto');
  }
}

function checkSite(source, site) {
  if (PROTECTED_PROJECTS.includes(site) || site === target.project) {
    problems.push(`${source} usa el sitio por defecto de un proyecto (${site})`);
  }
}

function checkHostingTarget(firebaserc, name) {
  const sites = firebaserc?.targets?.[target.project]?.hosting?.[name];
  if (!Array.isArray(sites) || sites.length === 0 || !sites.every(hasText)) {
    problems.push(`.firebaserc no mapea el target ${name} a sitios del proyecto declarado`);
    return;
  }
  for (const site of sites) checkSite(`el target ${name}`, site);
}

function checkHostingDestination(hosting, firebaserc) {
  const site = hosting?.site;
  const targetName = hosting?.target;
  if (hasText(site) && hasText(targetName)) {
    problems.push('firebase.json nombra site y target a la vez');
  } else if (hasText(site)) {
    checkSite('firebase.json', site);
  } else if (hasText(targetName)) {
    checkHostingTarget(firebaserc, targetName);
  } else {
    // Sin site ni target, firebase deploy publica en el sitio por defecto del proyecto.
    problems.push('firebase.json no nombra un site o target propio de Hosting');
  }
}

function rewriteServices(rewrite) {
  // El servicio protegido existe como Cloud Run y como Function: se puede apuntar por ambas vías.
  const services = [];
  if (rewrite?.run !== undefined) services.push(rewrite.run?.serviceId);
  if (rewrite?.function !== undefined) services.push(rewrite.function?.functionId ?? rewrite.function);
  return services;
}

function checkRewrites(hosting) {
  const rewrites = Array.isArray(hosting?.rewrites) ? hosting.rewrites : [];
  const services = rewrites.flatMap(rewriteServices);
  for (const service of services) {
    if (service === PROTECTED_SERVICE) {
      problems.push(`firebase.json reescribe al servicio protegido ${PROTECTED_SERVICE}`);
    } else if (service !== target.service) {
      problems.push(`firebase.json reescribe a ${service}, que no es el servicio declarado`);
    }
  }
  if (target.service && !services.includes(target.service)) {
    problems.push(`firebase.json no reescribe tráfico al servicio declarado ${target.service}`);
  }
}

const target = declaredTarget(process.argv.slice(2));

if (target.project) checkProtected('--project', target.project);
if (target.service === PROTECTED_SERVICE) problems.push(`--service declara el servicio protegido ${PROTECTED_SERVICE}`);

const firebaserc = readJson('.firebaserc');
checkFirebaserc(firebaserc);

const firebaseJson = readJson('firebase.json');
const hostingConfigs = [firebaseJson?.hosting ?? []].flat();
if (hostingConfigs.length === 0) problems.push('firebase.json no tiene configuración de Hosting');
for (const hosting of hostingConfigs) {
  checkHostingDestination(hosting, firebaserc);
  checkRewrites(hosting);
}

for (const name of PROJECT_ENV_VARS) {
  if (process.env[name]) checkMatchesTarget(`la variable ${name}`, process.env[name]);
}

// Sin proyecto activo, un gcloud sin --project falla por sí solo; con otro, iría a ese proyecto.
const activeProject = activeGcloudProject();
if (activeProject) checkMatchesTarget('el proyecto activo de gcloud', activeProject);

if (problems.length > 0) {
  console.error('DESPLIEGUE BLOQUEADO: no desplegar hasta definir servicio propio.');
  for (const problem of problems) console.error(`- ${problem}`);
  console.error('Ver DEPLOY.md.');
  process.exit(1);
}

console.log(`Verificación previa correcta: proyecto ${target.project} y servicio ${target.service}, ajenos al portal protegido.`);
