# Flujo de Deploy — Bidtory Aplica Frontend

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

## Referencias útiles

- Servicio Cloud Run: `ssrprocurementportalapp`, región `us-central1`, proyecto `procurement-portal-app`.
- URL típica del servicio (consola o `gcloud run services describe`): `https://ssrprocurementportalapp-<hash>-uc.a.run.app`
