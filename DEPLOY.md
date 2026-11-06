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
> npm run deploy:check -- --project PROYECTO_DE_DESTINO
> ```
>
> Sale con error si `.firebaserc`, `firebase.json`, `--project`, las variables de proyecto o el proyecto activo de `gcloud` apuntan al portal protegido (por ID o por número, como Cloud Run o como Function), si `firebase.json` no nombra un `site` o `target` propio de Hosting, o si no puede leer la configuración. Hoy falla, y debe seguir fallando.
>
> La verificación no impide por sí sola un `gcloud run deploy` o `firebase deploy` lanzado a mano: hay que ejecutarla antes.

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
4. Que `npm run deploy:check -- --project PROYECTO_DE_DESTINO` pase, y que el propietario autorice publicar.

## Arquitectura

- **Firebase Hosting** sirve archivos estáticos desde `public/` y hace **rewrite** de todo el tráfico a **Cloud Run** (`ssrprocurementportalapp`) para el SSR de Next.js.
- **`firebase deploy` (solo Hosting)** sube `public/` y las reglas; **no construye ni actualiza** la imagen de Cloud Run del Next.js.
- El **SSR** vive en **Cloud Run**: hay que desplegarlo con **`gcloud run deploy --source`**, que ejecuta el build en Google Cloud Build (incluye `npm run build` → genera `.next`).

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
- **`.env` y `.env.local` nunca se suben**, tampoco sus copias en subcarpetas: `.gcloudignore` los excluye. Un build con `gcloud run deploy --source` no los recibe, así que las variables `NEXT_PUBLIC_*` deben llegarle por otra vía.

## Referencias útiles

- Servicio Cloud Run: `ssrprocurementportalapp`, región `us-central1`, proyecto `procurement-portal-app`.
- URL típica del servicio (consola o `gcloud run services describe`): `https://ssrprocurementportalapp-<hash>-uc.a.run.app`
