import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
let alreadyFinalized = false;

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
    if (alreadyFinalized) {
      return json({ error: 'Esta subida ya se finalizó.', reason: 'already_finalized', id: 'doc-previo' }, 403);
    }
    if (rejectFinalize) return json({ error: 'La subida no está autorizada para este destino.' }, 403);
    return failFinalize ? json({ error: 'Error interno del servidor.' }, 500) : json({ id: 'doc-1' }, 201);
  }
  return json({ message: 'ok' });
};

let proposalApi: typeof import('@/lib/proposal-documents-api');
let contactApi: typeof import('@/lib/contact-api');
let uploadApi: typeof import('@/lib/upload-finalize');

before(async () => {
  const { auth } = await import('@/lib/firebase');
  Object.defineProperty(auth, 'currentUser', { value: { getIdToken: async () => 'test-token' } });
  globalThis.fetch = interceptedFetch as typeof fetch;
  proposalApi = await import('@/lib/proposal-documents-api');
  contactApi = await import('@/lib/contact-api');
  uploadApi = await import('@/lib/upload-finalize');
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
  alreadyFinalized = false;
});

describe('B06 · subida de documentos de propuesta', () => {
  it('firma, sube y finaliza por el gateway con el token del usuario', async () => {
    const pendingUpload: { current: PendingProposalUpload | null } = { current: null };

    await proposalApi.uploadProposalDocument(uploadInput(), pendingUpload);

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
    await assert.rejects(proposalApi.uploadProposalDocument(input, pendingUpload), /Error interno del servidor/);
    assert.equal(pendingUpload.current?.gcsUri, GCS_URI);

    failFinalize = false;
    calls = [];
    await proposalApi.uploadProposalDocument(input, pendingUpload);

    assert.deepEqual(endpoints(), ['POST /api-proxy/finalize_proposal_document_upload']);
    assert.equal(calls[0].body.gcs_uri, GCS_URI);
    assert.equal(pendingUpload.current, null);
  });

  it('si el backend rechaza la subida, el siguiente intento vuelve a cargar el archivo', async () => {
    const input = uploadInput();
    const pendingUpload: { current: PendingProposalUpload | null } = { current: null };

    rejectFinalize = true;
    await assert.rejects(proposalApi.uploadProposalDocument(input, pendingUpload), /no está autorizada/);
    assert.equal(pendingUpload.current, null);

    rejectFinalize = false;
    calls = [];
    await proposalApi.uploadProposalDocument(input, pendingUpload);

    assert.equal(calls.length, 3);
  });

  it('otro archivo no reutiliza una carga pendiente', async () => {
    const pendingUpload: { current: PendingProposalUpload | null } = { current: null };

    failFinalize = true;
    await assert.rejects(proposalApi.uploadProposalDocument(uploadInput(), pendingUpload));
    failFinalize = false;
    calls = [];

    await proposalApi.uploadProposalDocument(uploadInput(), pendingUpload);

    assert.equal(calls.length, 3);
  });
});

describe('R2 · una subida ya finalizada es un éxito', () => {
  it('tras perder la respuesta, el reintento devuelve el id y no vuelve a cargar el archivo', async () => {
    const input = uploadInput();
    const pendingUpload: { current: PendingProposalUpload | null } = { current: null };

    failFinalize = true;
    await assert.rejects(proposalApi.uploadProposalDocument(input, pendingUpload));

    failFinalize = false;
    alreadyFinalized = true;
    calls = [];
    const result = await proposalApi.uploadProposalDocument(input, pendingUpload);

    assert.deepEqual(endpoints(), ['POST /api-proxy/finalize_proposal_document_upload']);
    assert.equal(result.id, 'doc-previo');
    assert.equal(pendingUpload.current, null);
  });

  it('una finalización normal también devuelve el id', async () => {
    const result = await proposalApi.uploadProposalDocument(uploadInput(), { current: null });

    assert.equal(result.id, 'doc-1');
  });

  it('otro 403 sigue siendo un error', async () => {
    rejectFinalize = true;

    await assert.rejects(
      uploadApi.finalizeUpload('/finalize_proposal_document_upload', {}),
      /no está autorizada/,
    );
  });

  it('ningún finalizador se salta el helper', () => {
    const sourceFiles = readdirSync('src', { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
      .map((entry) => join(entry.parentPath, entry.name));

    for (const file of sourceFiles) {
      assert.doesNotMatch(readFileSync(file, 'utf8'), /apiClient\.post(<[^(]*>)?\(\s*'\/finalize_/, file);
    }
  });
});

describe('B07 · sin llamadas al proyecto antiguo', () => {
  const proposalDocument = { id: 'doc-1', customerId: 'customer-a', opportunityId: 'opportunity-a' };

  it('editar metadatos usa PATCH en el gateway', async () => {
    await proposalApi.updateProposalDocument(proposalDocument, { version_label: 'v2', description: 'Ajustes' });

    assert.deepEqual(endpoints(), ['PATCH /api-proxy/update_proposal_document']);
    assert.equal(calls[0].authorization, 'Bearer test-token');
    assert.equal(calls[0].body.id, 'doc-1');
    assert.equal(calls[0].body.version_label, 'v2');
    assert.equal(calls[0].body.description, 'Ajustes');
  });

  it('cambiar estado usa PATCH en el gateway', async () => {
    await proposalApi.updateProposalDocument(proposalDocument, { status: 'Aprobado' });

    assert.deepEqual(endpoints(), ['PATCH /api-proxy/update_proposal_document']);
    assert.equal(calls[0].body.status, 'Aprobado');
  });

  it('eliminar envía la oportunidad que el backend necesita para localizar el documento', async () => {
    await proposalApi.deleteProposalDocument(proposalDocument);

    assert.deepEqual(endpoints(), ['DELETE /api-proxy/delete_document']);
    assert.equal(calls[0].authorization, 'Bearer test-token');
    assert.deepEqual(calls[0].body, {
      document_id: 'doc-1',
      kind: 'ProposalDocuments',
      customer_id: 'customer-a',
      opportunity_id: 'opportunity-a',
    });
  });

  it('el formulario de contacto usa el gateway', async () => {
    await contactApi.sendContactForm({
      fullName: 'Persona de prueba',
      companyName: 'Empresa de prueba',
      email: 'prueba@example.test',
      interest: 'otra-consulta',
      message: '',
      recaptchaToken: 'test-recaptcha',
    });

    assert.deepEqual(endpoints(), ['POST /api-proxy/handle_contact_form']);
    assert.equal(calls[0].body.recaptchaToken, 'test-recaptcha');
  });

  it('todas las operaciones juntas no salen del gateway ni de la URL firmada', async () => {
    const pendingUpload: { current: PendingProposalUpload | null } = { current: null };
    await proposalApi.uploadProposalDocument(uploadInput(), pendingUpload);
    await proposalApi.updateProposalDocument(proposalDocument, { status: 'Aprobado' });
    await proposalApi.deleteProposalDocument(proposalDocument);

    for (const { url } of calls) {
      assert.ok(url.startsWith('/api-proxy/') || url === SIGNED_URL, `llamada inesperada: ${url}`);
      assert.doesNotMatch(url, /procurement-portal|cloudfunctions\.net/);
    }
  });

  it('src no conserva destinos del proyecto antiguo', () => {
    const sourceFiles = readdirSync('src', { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.tsx?$/.test(entry.name))
      .map((entry) => join(entry.parentPath, entry.name));

    assert.ok(sourceFiles.length > 50);
    for (const file of sourceFiles) {
      assert.doesNotMatch(
        readFileSync(file, 'utf8'),
        /procurement-portal|cloudfunctions\.net|NEXT_PUBLIC_CF_BASE_URL|GATEWAY_URL\}/,
        file
      );
    }
  });

  it('propuestas y contacto no hacen fetch propio fuera de los módulos probados', () => {
    for (const file of [
      'src/components/opportunities/ProposalDocumentsSection.tsx',
      'src/components/contact/ContactForm.tsx',
    ]) {
      assert.doesNotMatch(readFileSync(file, 'utf8'), /\bfetch\(/, file);
    }
  });
});
