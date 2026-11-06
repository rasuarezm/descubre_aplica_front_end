# Flujo de Deploy — Bidtory Aplica Frontend

> ## ⛔ Bloqueo vigente: no desplegar hasta definir servicio propio
>
> Este repositorio es el portal nuevo, pero `.firebaserc` y `firebase.json` siguen apuntando al proyecto `procurement-portal-app` y al servicio `ssrprocurementportalapp`, que atienden el portal protegido. Desplegar desde aquí puede sobrescribir ese portal en producción (hallazgo B08 de `docs/auditoria-bidtory-2026-11-06.md`, en la raíz `~/dev`).
>
> **Los comandos de este documento describen el destino del portal protegido. No los ejecutes desde este repositorio.**
>
> Antes de cualquier despliegue, ejecuta la verificación previa con el proyecto de destino:
>
> ```bash
> npm run deploy:check -- --project PROYECTO_DE_DESTINO --service SERVICIO_DE_DESTINO
> ```
>
> Falla cerrado: solo pasa si el destino es completo, explícito y coherente.
>
> - `--project` y `--service` se declaran una sola vez y ninguno es el portal protegido.
> - `.firebaserc` tiene `default` igual a `--project` y ningún alias protegido.
> - `firebase.json` nombra un `site` o un `target` propio, no el sitio por defecto del proyecto. Si usa `target`, `.firebaserc` lo mapea a sitios de ese proyecto.
> - Hay un rewrite al servicio declarado y ninguno a otro servicio o Function.
> - `gcloud` responde, y las variables de proyecto y el proyecto activo de `gcloud`, si existen, coinciden con `--project`. Para fijarlo solo en esta terminal: `export CLOUDSDK_CORE_PROJECT=PROYECTO_DE_DESTINO`.
>
> Cualquier otro caso sale con error, también si no puede leer la configuración. Hoy falla, y debe seguir fallando: B08 sigue abierto mientras la configuración apunte al portal protegido.
>
> La verificación no impide por sí sola un `gcloud run deploy` o `firebase deploy` lanzado a mano: hay que ejecutarla antes y revisar el comando final.

## Estado comprobado en la nube (6-nov-2026)

Fuente: salida de los comandos de lectura en `docs/estado-nube-2026-11-06.txt`, en la raíz `~/dev`. Es una foto de esa fecha; repítela antes de actuar.

| Comprobación | Resultado |
|---|---|
| Portal protegido | `ssrprocurementportalapp` en `procurement-portal-app`, revisión `ssrprocurementportalapp-00008-8rj` con 100 % del tráfico |
| Riesgo de sobrescritura | Real: el tráfico sigue a la última revisión (`latestRevision: true`), así que un despliegue a ese servicio pasa a producción de inmediato |
| Forma del servicio | Existe como Cloud Run y también como Function, con última actualización el 2026-03-23 |
| Portal nuevo en esa revisión | Sin indicios: esa fecha es anterior al primer commit de este repositorio (2026-03-26). No es prueba definitiva: falta la fecha de creación de la revisión `00008-8rj` |
| Servicio propio del portal nuevo | **No existe**: `pc-sitioweb-1724428189856` no tiene ningún servicio SSR del portal |
| Gateways | `aplica-gateway` y `bidtory-gateway` en `pc-sitioweb-1724428189856`; `procurement-portal-gateway` en `procurement-portal-app` (número `763056400659`) |
| Hosting | **Sin comprobar**: los dos listados de sitios fallaron con 401. Se desconocen los sitios y dominios de ambos proyectos |

Si un despliegue llegara al servicio protegido por error, la revisión a la que volver es `ssrprocurementportalapp-00008-8rj` (ver «Cambiar el tráfico a una revisión concreta»).

## Condiciones para levantar el bloqueo

1. Tener los listados de Hosting de ambos proyectos. `agente_oportunidades` publica HTML en el sitio por defecto de `pc-sitioweb-1724428189856`: cambiar solo el proyecto en `.firebaserc` lo sobrescribiría.
2. Que el propietario defina proyecto, servicio, sitio de Hosting y dominio propios.
3. Crear ese destino y apuntar a él `.firebaserc`, `firebase.json` y este documento.
4. Que `npm run deploy:check -- --project PROYECTO_DE_DESTINO --service SERVICIO_DE_DESTINO` pase, y que el propietario autorice publicar.

## Arquitectura

- **Firebase Hosting** sirve archivos estáticos desde `public/` y hace **rewrite** de todo el tráfico a **Cloud Run** (`ssrprocurementportalapp`) para el SSR de Next.js.
- **`firebase deploy` (solo Hosting)** sube `public/` y las reglas; **no construye ni actualiza** la imagen de Cloud Run del Next.js.
- El **SSR** vive en **Cloud Run**: hay que desplegarlo con **`gcloud run deploy --source`**, que ejecuta el build en Google Cloud Build (incluye `npm run build` → genera `.next`).

## Variables del build (`NEXT_PUBLIC_*`)

Next.js incrusta las variables `NEXT_PUBLIC_*` en el JavaScript durante `next build`. Definirlas solo en el runtime de Cloud Run no cambia un JavaScript ya construido. `.env` y `.env.local` no viajan en el source (`.gcloudignore`), así que hay que pasarlas al build de forma explícita.

La lista completa, con valores ficticios, está en `build-env.example.yaml`. Esos valores sirven para comprobar la receta, nunca para publicar. Todas son públicas: acaban en el navegador. Ningún secreto debe llevar el prefijo `NEXT_PUBLIC_`.

### Lista completa

La columna «Si falta en el build» se midió quitando cada variable por separado, con las demás presentes (6-nov-2026). **Un build que pasa no prueba que la configuración esté completa:** seis de las nueve obligatorias no lo rompen. Por eso existe el paso 1 de «Comprobar la receta». El efecto en el navegador no se midió.

| Variable | Obligatoria | Si falta en el build | Uso |
|---|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Sí | **Falla** (`auth/invalid-api-key`) | Firebase Auth y Firestore |
| `NEXT_PUBLIC_API_BASE_URL` | Sí | **Falla** (prerender de `/`) | Base de Aplica. Valor esperado: `/api-proxy` |
| `NEXT_PUBLIC_DESCUBRE_API_URL` | Sí | **Falla** (prerender de `/registro`) | Base de Descubre. Valor esperado: `/api-descubre-proxy` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Sí | Pasa sin avisar | Proyecto de Firebase de Auth y Firestore |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Sí | Pasa sin avisar | Configuración web de Firebase |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Sí | Pasa sin avisar | Configuración web de Firebase |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Sí | Pasa sin avisar | Configuración web de Firebase; hoy sin consumidor directo |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sí | Pasa sin avisar | Configuración web de Firebase; hoy sin consumidor directo |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Sí | Pasa sin avisar | Clave pública de reCAPTCHA. Sin ella, `/registro` usa la clave escrita en el código y `/contact` el texto `do-not-use-this-key` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | No | Pasa | Configuración web de Firebase; el SDK de Analytics no se usa |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | No | Pasa | Sin ella no se carga Google Analytics |
| `NEXT_PUBLIC_DOCUMENTS_BUCKET_NAME` | No | Pasa | Por defecto `aplica-documents-pc-sitioweb`. Debe coincidir con `DOCUMENTS_BUCKET_NAME` del backend |

Las bases de API deben ser las rutas relativas de los proxies: una URL absoluta saltaría el proxy y dependería de `connect-src` en `next.config.ts`.

### Lo que no va en el build

| Variable | Dónde va |
|---|---|
| `APLICA_GATEWAY_URL`, `DESCUBRE_GATEWAY_URL` | Runtime del servidor: las leen los proxies, no el navegador. Son opcionales: sin ellas se usan los gateways escritos en cada `route.ts` |
| Clave **secreta** de reCAPTCHA | Solo en el backend, en Secret Manager |
| `GEMINI_API_KEY` | No se usa en el build ni en el portal: solo la lee Genkit en `src/ai`, que la aplicación no importa |
| `NEXT_PUBLIC_CF_BASE_URL` | No definirla: aparece en `.env.local` pero ningún código la usa |

### Dónde se definen

**Cloud Run (`gcloud run deploy --source`, la arquitectura actual).** Sin `Dockerfile`, el build usa buildpacks. Copia `build-env.example.yaml` fuera del repositorio con los valores del destino propio y pásalo con `--build-env-vars-file`. `--set-env-vars` define solo el runtime. Estos flags no existen para despliegues desde imagen. Un `Dockerfile` en el repositorio tendría prioridad sobre buildpacks y habría que revisar esta receta.

```bash
gcloud run deploy SERVICIO_DE_DESTINO \
  --source . \
  --region REGION_DE_DESTINO \
  --project PROYECTO_DE_DESTINO \
  --build-env-vars-file RUTA/build-env.yaml \
  --set-env-vars APLICA_GATEWAY_URL=URL_APLICA,DESCUBRE_GATEWAY_URL=URL_DESCUBRE
```

Este comando queda sujeto al bloqueo de B08: no lo ejecutes hasta cumplir «Condiciones para levantar el bloqueo». `--build-env-vars-file` sustituye todas las variables de build anteriores, así que el archivo debe estar completo.

**App Hosting (solo si el destino propio se crea así; hoy no hay backend declarado).** Las variables van en la lista `env` de `apphosting.yaml`, o de `apphosting.<entorno>.yaml`, que van versionados: admiten estos valores públicos, no secretos. La consola de Firebase tiene prioridad sobre esos archivos. Sin `availability`, una variable existe en build y en runtime.

```yaml
env:
  - variable: NEXT_PUBLIC_FIREBASE_API_KEY
    value: VALOR_DEL_DESTINO
    availability:
      - BUILD
  # ...una entrada igual por cada variable obligatoria
  - variable: APLICA_GATEWAY_URL
    value: URL_APLICA
    availability:
      - RUNTIME
```

No añadas a `apphosting.yaml` los valores ficticios: ese archivo se usaría en un despliegue real.

### Comprobar la receta

**1. Comprobar el archivo real.** Los dos comandos no deben imprimir ninguna línea: la primera detecta variables que faltan y la segunda, valores ficticios olvidados.

```bash
for name in $(sed -nE 's/^([A-Z_]+): .*/\1/p' build-env.example.yaml); do grep -qE "^$name: \".+\"$" RUTA/build-env.yaml || echo "FALTA $name"; done
```

```bash
grep -nE 'fictici|FICTICIO|000000000000' RUTA/build-env.yaml
```

**2. Comprobar que el código construye sin `.env` y sin red (macOS).** Parte de una copia limpia del último commit y de un entorno vacío, y bloquea la red, incluida la resolución de nombres. Debe terminar con salida 0 y el último `grep` debe listar archivos: es la prueba de que los valores quedaron incrustados.

```bash
DIR="$(mktemp -d)"
git archive HEAD | tar -x -C "$DIR"
ln -s "$PWD/node_modules" "$DIR/node_modules"
cd "$DIR"
env -i PATH="$PATH" HOME="$HOME" NEXT_TELEMETRY_DISABLED=1 \
  $(sed -nE 's/^([A-Z_]+): "(.*)"$/\1=\2/p' build-env.example.yaml) \
  sandbox-exec -p '(version 1)(allow default)(deny network-outbound (remote ip))(deny network-outbound (remote unix-socket (path-literal "/private/var/run/mDNSResponder")))' \
  npm run build
grep -rl 'ficticio-project-id' .next/static
```

Ese build es solo una comprobación: sus valores ficticios no sirven para publicar.

Estado a 6-nov-2026: el paso 2 pasa. **Sin comprobar:** un build real en Cloud Build o en App Hosting. Nunca se ejecutó ninguno de los dos, porque el despliegue sigue bloqueado. Tras el primer build real, confirma que el `projectId` del destino aparece en el JavaScript servido.

## Deploy del frontend SSR (código Next.js, `src/`, etc.)

Desde la raíz del proyecto frontend (`procurement_portal_front_end`):

```bash
cd /ruta/a/procurement_portal_front_end

gcloud run deploy ssrprocurementportalapp \
  --source . \
  --region us-central1 \
  --project procurement-portal-app
```

- La primera vez puede pedir habilitar **Cloud Build** u otras APIs; acéptalo.
- `--source .` empaqueta el proyecto y en la nube se ejecuta el build (p. ej. `npm run build` definido en `package.json`).

Si el tráfico no queda en la última revisión o hubo un deploy previo a medias:

```bash
gcloud run services update-traffic ssrprocurementportalapp \
  --to-latest \
  --region us-central1 \
  --project procurement-portal-app
```

### Qué **no** sustituye al paso anterior

- **`firebase deploy`** sin más **no** actualiza la imagen SSR en Cloud Run con este `firebase.json` (Hosting con `public` + rewrite a Run). Úsalo para estáticos (sección siguiente) o cuando cambies solo reglas de Hosting.

## Deploy solo de archivos estáticos (`public/`)

Cuando solo cambias assets en `public/`:

```bash
firebase deploy --only hosting --project procurement-portal-app
```

## Listar revisiones de Cloud Run

```bash
gcloud run revisions list \
  --service ssrprocurementportalapp \
  --region us-central1 \
  --project procurement-portal-app
```

## Cambiar el tráfico a una revisión concreta

```bash
gcloud run services update-traffic ssrprocurementportalapp \
  --to-revisions NOMBRE-REVISION=100 \
  --region us-central1 \
  --project procurement-portal-app
```

## Ignore files (subidas y deploy)

- **`.firebaseignore`**: si existe, Firebase CLI lo usa **en lugar de** `.gitignore` al subir archivos. Así evitas que reglas como `/.next/` en `.gitignore` impidan incluir el build cuando haga falta. No listes `.next` aquí si tu flujo depende de subirla.
- **`.gcloudignore`**: usado por herramientas `gcloud` al empaquetar código; mismo criterio: no ignores `.next` si debe formar parte del contexto de build.
- **`.env` y `.env.local` nunca se suben**, tampoco sus copias en subcarpetas: `.gcloudignore` los excluye. Un build con `gcloud run deploy --source` no los recibe: ver «Variables del build».

## Referencias útiles

- Servicio Cloud Run: `ssrprocurementportalapp`, región `us-central1`, proyecto `procurement-portal-app`.
- URL típica del servicio (consola o `gcloud run services describe`): `https://ssrprocurementportalapp-<hash>-uc.a.run.app`
