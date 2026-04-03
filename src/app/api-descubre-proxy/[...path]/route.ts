import { NextRequest, NextResponse } from 'next/server';

/** Destino real del API Gateway de Descubre. */
const GATEWAY_ORIGIN = (
  process.env.DESCUBRE_GATEWAY_URL ?? 'https://bidtory-gateway-1xa8cm8z.uc.gateway.dev'
).replace(/\/$/, '');

const API_PROXY_PREFIX = '/api-descubre-proxy';

/**
 * Construye la URL del gateway a partir de la URL del request.
 * No usamos solo `params` del catch-all: con Turbopack/Next 15 a veces llega vacío
 * y el proxy llamaba a `https://…gateway.dev/` (raíz) → 403 "permission … URL /".
 */
function resolveGatewayTarget(request: NextRequest): { target: string; error: string | null } {
  const url = new URL(request.url);
  if (!url.pathname.startsWith(API_PROXY_PREFIX)) {
    return { target: '', error: 'Ruta debe empezar por /api-descubre-proxy' };
  }
  const rest = url.pathname.slice(API_PROXY_PREFIX.length).replace(/^\/+/, '');
  if (!rest) {
    return { target: '', error: 'Falta el path del API tras /api-descubre-proxy' };
  }
  return {
    target: `${GATEWAY_ORIGIN}/${rest}${url.search}`,
    error: null,
  };
}

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
]);

function forwardHeaders(request: NextRequest): Headers {
  const out = new Headers();
  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return;
    out.set(key, value);
  });
  // Evita gzip upstream: fetch() en Node descomprime el cuerpo pero a veces deja
  // Content-Encoding en cabeceras; al reenviar al navegador provoca ERR_CONTENT_DECODING_FAILED.
  out.set('Accept-Encoding', 'identity');
  return out;
}

const SKIP_RESPONSE_HEADERS = new Set([
  'transfer-encoding',
  'content-encoding',
  'content-length',
]);

function forwardResponseHeaders(source: Headers): Headers {
  const out = new Headers();
  source.forEach((value, key) => {
    if (SKIP_RESPONSE_HEADERS.has(key.toLowerCase())) return;
    out.set(key, value);
  });
  return out;
}

async function proxy(request: NextRequest) {
  const { target, error } = resolveGatewayTarget(request);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[api-descubre-proxy]', request.method, target);
  }

  const headers = forwardHeaders(request);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const buf = await request.arrayBuffer();
    if (buf.byteLength > 0) {
      init.body = buf;
    }
  }

  const upstream = await fetch(target, init);

  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: forwardResponseHeaders(upstream.headers),
  });
}

export async function GET(request: NextRequest) {
  return proxy(request);
}

export async function POST(request: NextRequest) {
  return proxy(request);
}

export async function PATCH(request: NextRequest) {
  return proxy(request);
}

export async function PUT(request: NextRequest) {
  return proxy(request);
}

export async function DELETE(request: NextRequest) {
  return proxy(request);
}

export async function OPTIONS(request: NextRequest) {
  return proxy(request);
}
