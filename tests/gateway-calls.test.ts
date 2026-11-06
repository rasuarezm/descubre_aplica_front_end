import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import type { PendingProposalUpload } from '@/lib/proposal-documents-api';

// api-client y firebase leen estas variables al importarse; los valores son ficticios.
process.env.NEXT_PUBLIC_API_BASE_URL = '/api-proxy';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app';

const SIGNED_URL = 'https://storage.googleapis.com/test-bucket/proposal.pdf?X-Goog-Signature=abc';
const GCS_URI = 'gs://test-bucket/proposal.pdf';

interface InterceptedCall {
  method: string;
  url: string;
  authorization: string | null;
  body: any;
}

let calls: InterceptedCall[] = [];
let failFinalize = false;
let rejectFinalize = false;

/** Backend falso: responde como el gateway y registra cada llamada que hace el código real. */
const interceptedFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  const url = String(input);
  const headers = new Headers(init.headers);
  calls.push({
    method: init.method ?? 'GET',
    url,
    authorization: headers.get('Authorization'),
    body: typeof init.body === 'string' ? JSON.parse(init.body) : null,
  });

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

  if (url === SIGNED_URL) return new Response(null, { status: 200 });
  if (url.endsWith('/generate_document_upload_url')) return json({ upload_url: SIGNED_URL, gcs_uri: GCS_URI });
  if (url.endsWith('/finalize_proposal_document_upload')) {
    if (rejectFinalize) return json({ error: 'La subida no está autorizada para este destino.' }, 403);
    return failFinalize ? json({ error: 'Error interno del servidor.' }, 500) : json({ id: 'doc-1' }, 201);
  }
  return json({ message: 'ok' });
};

let uploadProposalDocument: typeof import('@/lib/proposal-documents-api').uploadProposalDocument;

before(async () => {
  const { auth } = await import('@/lib/firebase');
  Object.defineProperty(auth, 'currentUser', { value: { getIdToken: async () => 'test-token' } });
  globalThis.fetch = interceptedFetch as typeof fetch;
  ({ uploadProposalDocument } = await import('@/lib/proposal-documents-api'));
});

const uploadInput = () => ({
  file: new File(['contenido'], 'propuesta.pdf', { type: 'application/pdf' }),
  customerId: 'customer-a',
  opportunityId: 'opportunity-a',
  versionLabel: 'v1',
  status: 'Borrador',
});

const endpoints = () => calls.map((call) => `${call.method} ${call.url.split('?')[0]}`);

beforeEach(() => {
  calls = [];
  failFinalize = false;
  rejectFinalize = false;
});

describe('B06 · subida de documentos de propuesta', () => {
  it('firma, sube y finaliza por el gateway con el token del usuario', async () => {
    const pendingUpload: { current: PendingProposalUpload | null } = { current: null };

    await uploadProposalDocument(uploadInput(), pendingUpload);

    assert.deepEqual(endpoints(), [
      'POST /api-proxy/generate_document_upload_url',
      'PUT https://storage.googleapis.com/test-bucket/proposal.pdf',
      'POST /api-proxy/finalize_proposal_document_upload',
    ]);
    assert.equal(calls[0].authorization, 'Bearer test-token');
    assert.equal(calls[2].authorization, 'Bearer test-token');
    assert.equal(calls[2].body.gcs_uri, GCS_URI);
    assert.equal(calls[2].body.customer_id, 'customer-a');
    assert.equal(calls[2].body.opportunity_id, 'opportunity-a');
    assert.equal(pendingUpload.current, null);
  });

  it('si falla la finalización, reintenta sin volver a cargar el archivo', async () => {
    const input = uploadInput();
    const pendingUpload: { current: PendingProposalUpload | null } = { current: null };

    failFinalize = true;
    await assert.rejects(uploadProposalDocument(input, pendingUpload), /Error interno del servidor/);
    assert.equal(pendingUpload.current?.gcsUri, GCS_URI);

    failFinalize = false;
    calls = [];
    await uploadProposalDocument(input, pendingUpload);

    assert.deepEqual(endpoints(), ['POST /api-proxy/finalize_proposal_document_upload']);
    assert.equal(calls[0].body.gcs_uri, GCS_URI);
    assert.equal(pendingUpload.current, null);
  });

  it('si el backend rechaza la subida, el siguiente intento vuelve a cargar el archivo', async () => {
    const input = uploadInput();
    const pendingUpload: { current: PendingProposalUpload | null } = { current: null };

    rejectFinalize = true;
    await assert.rejects(uploadProposalDocument(input, pendingUpload), /no está autorizada/);
    assert.equal(pendingUpload.current, null);

    rejectFinalize = false;
    calls = [];
    await uploadProposalDocument(input, pendingUpload);

    assert.equal(calls.length, 3);
  });

  it('otro archivo no reutiliza una carga pendiente', async () => {
    const pendingUpload: { current: PendingProposalUpload | null } = { current: null };

    failFinalize = true;
    await assert.rejects(uploadProposalDocument(uploadInput(), pendingUpload));
    failFinalize = false;
    calls = [];

    await uploadProposalDocument(uploadInput(), pendingUpload);

    assert.equal(calls.length, 3);
  });
});
