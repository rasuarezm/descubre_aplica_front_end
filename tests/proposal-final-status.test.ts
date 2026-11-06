import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Opportunity, ProposalDocument, UserProfile } from '@/types';

// api-client y firebase leen estas variables al importarse; los valores son ficticios.
process.env.NEXT_PUBLIC_API_BASE_URL = '/api-proxy';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app';

const WORKING_STATUSES = ['Borrador', 'En Revisión Interna', 'En Revisión Cliente'];
const FINAL_STATUSES = ['Aprobado', 'Presentado'];

const COLLABORATOR = { role: 'customer', customer_role: 'colaborador' } as UserProfile;
const CUSTOMER_ADMIN = { role: 'customer', customer_role: 'administrador_cliente' } as UserProfile;
const ADMIN = { role: 'admin' } as UserProfile;
const READER = { role: 'customer', customer_role: 'lector' } as UserProfile;

const OPPORTUNITY = {
  id: 'opp-a',
  customer_id: 'A',
  title: 'Oportunidad',
  work_breakdown_structure: { data: [], generated_at: '2026-11-01T10:00:00Z', status: 'generado' },
} as unknown as Opportunity;

const version = (overrides: Partial<ProposalDocument>) =>
  ({
    id: 'doc-a',
    parent_document_id: null,
    filename: 'propuesta.pdf',
    version_label: 'v1',
    is_latest_version: true,
    uploaded_at: '2026-11-01T10:00:00Z',
    status: 'Borrador',
    ...overrides,
  }) as ProposalDocument;

let Section: typeof import('@/components/opportunities/ProposalDocumentsSection').ProposalDocumentsSection;

before(async () => {
  // tsx compila el JSX con React.createElement; Next lo resuelve solo.
  Object.assign(globalThis, { React });
  ({ ProposalDocumentsSection: Section } = await import('@/components/opportunities/ProposalDocumentsSection'));
});

/** Lo que ve cada rol en la fila de la versión vigente, leído del HTML real del componente. */
function row(userProfile: UserProfile, proposalDocuments: ProposalDocument[]) {
  const page = renderToStaticMarkup(
    createElement(Section, {
      userProfile,
      opportunity: OPPORTUNITY,
      proposalDocuments,
      proposalDocumentStatuses: { all_statuses: [...WORKING_STATUSES, ...FINAL_STATUSES], default_status: 'Borrador' },
      tenderDocuments: [],
      onRefreshData: () => {},
    }),
  );
  // El visor de WBS, debajo de los documentos, tiene su propio botón «Editar».
  const html = page.slice(0, page.indexOf('Generado el'));
  const selector = html.match(/<button[^>]*role="combobox"[^>]*>/)?.[0] ?? '';
  return {
    selectorEnabled: selector !== '' && !/\sdisabled=""/.test(selector),
    newVersion: html.includes('Nueva Versión'),
    edit: html.includes('Editar'),
    remove: /lucide-trash/.test(html),
    download: html.includes('Descargar'),
  };
}

describe('B33: un colaborador no sale de un estado final', () => {
  for (const status of FINAL_STATUSES) {
    it(`en «${status}» no cambia el estado, no versiona ni borra; sí edita metadatos`, () => {
      assert.deepEqual(row(COLLABORATOR, [version({ status })]), {
        selectorEnabled: false,
        newVersion: false,
        edit: true,
        remove: false,
        download: true,
      });
    });
  }

  for (const status of WORKING_STATUSES) {
    it(`en «${status}» conserva todas las acciones`, () => {
      assert.deepEqual(row(COLLABORATOR, [version({ status })]), {
        selectorEnabled: true,
        newVersion: true,
        edit: true,
        remove: true,
        download: true,
      });
    });
  }

  it('un documento antiguo sin estado no rompe la fila ni se bloquea', () => {
    const legacy = version({ status: undefined as unknown as string });

    assert.equal(row(COLLABORATOR, [legacy]).newVersion, true);
  });

  it('manda la versión vigente: una aprobada antigua no bloquea', () => {
    const thread = [
      version({ id: 'doc-a', status: 'Aprobado', is_latest_version: false }),
      version({ id: 'doc-b', parent_document_id: 'doc-a', status: 'Borrador', uploaded_at: '2026-11-02T10:00:00Z' }),
    ];

    assert.equal(row(COLLABORATOR, thread).newVersion, true);
  });

  it('manda la versión vigente: una aprobada sobre un borrador bloquea', () => {
    const thread = [
      version({ id: 'doc-a', status: 'Borrador', is_latest_version: false }),
      version({ id: 'doc-b', parent_document_id: 'doc-a', status: 'Aprobado', uploaded_at: '2026-11-02T10:00:00Z' }),
    ];

    assert.equal(row(COLLABORATOR, thread).newVersion, false);
  });
});

describe('B33: quien puede poner el estado final, puede salir de él', () => {
  const managers: Array<[string, UserProfile]> = [
    ['administrador_cliente', CUSTOMER_ADMIN],
    ['admin', ADMIN],
  ];

  for (const [name, profile] of managers) {
    for (const status of FINAL_STATUSES) {
      it(`${name} en «${status}» conserva todas las acciones`, () => {
        assert.deepEqual(row(profile, [version({ status })]), {
          selectorEnabled: true,
          newVersion: true,
          edit: true,
          remove: true,
          download: true,
        });
      });
    }
  }

  it('un lector sigue sin acciones', () => {
    assert.deepEqual(row(READER, [version({ status: 'Aprobado' })]), {
      selectorEnabled: false,
      newVersion: false,
      edit: false,
      remove: false,
      download: true,
    });
  });
});
