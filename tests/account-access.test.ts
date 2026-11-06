import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { before, beforeEach, describe, it } from 'node:test';
import React, { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { ActionAccess } from '@/lib/account-status';
import type { DocumentItem, Opportunity, RupContract, UserProfile } from '@/types';

// api-client y firebase leen estas variables al importarse; los valores son ficticios.
process.env.NEXT_PUBLIC_API_BASE_URL = '/api-proxy';
process.env.NEXT_PUBLIC_DESCUBRE_API_URL = '/api-descubre-proxy';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app';

const COLLABORATOR = { role: 'customer', customer_role: 'colaborador' } as UserProfile;
const READER = { role: 'customer', customer_role: 'lector' } as UserProfile;
const NO_ROLE = { role: 'customer' } as UserProfile;

const TENDER_DOCS = [
  { id: 'doc-a', name: 'Pliego', tender_document_category: 'Terminos de Referencia' },
] as unknown as DocumentItem[];

const IA_ANALYSIS = {
  analysis_status: 'completed',
  qualifying_requirements: { legal: ['Requisito'] },
  required_documents_checklist: [{ document_name: 'Póliza', requirement_details: 'Detalle' }],
} as unknown as Opportunity['ia_analysis'];

type ProfileResponse = { status: number; body?: unknown } | 'network-down';
let profileResponse: ProfileResponse;

const interceptedFetch = async (): Promise<Response> => {
  if (profileResponse === 'network-down') throw new TypeError('Failed to fetch');
  return new Response(JSON.stringify(profileResponse.body ?? {}), {
    status: profileResponse.status,
    headers: { 'Content-Type': 'application/json' },
  });
};

let account: typeof import('@/lib/account-status');
let accountContext: typeof import('@/contexts/account-context');
let Notice: typeof import('@/components/account/AccountSuspendedNotice').AccountSuspendedNotice;
let Proposal: typeof import('@/components/opportunities/ProposalDocumentsSection').ProposalDocumentsSection;
let IaTab: typeof import('@/components/opportunities/IaAnalysisTabContent').IaAnalysisTabContent;
let Row: typeof import('@/components/customers/RupContractsWidget').ContractRow;

before(async () => {
  // tsx compila el JSX con React.createElement; Next lo resuelve solo.
  Object.assign(globalThis, { React });
  const { auth } = await import('@/lib/firebase');
  Object.defineProperty(auth, 'currentUser', { value: { getIdToken: async () => 'test-token' } });
  globalThis.fetch = interceptedFetch as typeof fetch;
  account = await import('@/lib/account-status');
  accountContext = await import('@/contexts/account-context');
  ({ AccountSuspendedNotice: Notice } = await import('@/components/account/AccountSuspendedNotice'));
  ({ ProposalDocumentsSection: Proposal } = await import('@/components/opportunities/ProposalDocumentsSection'));
  ({ IaAnalysisTabContent: IaTab } = await import('@/components/opportunities/IaAnalysisTabContent'));
  ({ ContractRow: Row } = await import('@/components/customers/RupContractsWidget'));
});

beforeEach(() => {
  profileResponse = { status: 200, body: { uid: 'u-1' } };
});

/** Estado del botón que contiene `text`, leído del HTML real: ausente, activo o deshabilitado. */
function button(html: string, text: string): 'absent' | 'enabled' | 'disabled' {
  const end = html.indexOf(text);
  if (end === -1) return 'absent';
  const tag = html.slice(html.lastIndexOf('<button', end), end);
  return /\sdisabled=""/.test(tag.slice(0, tag.indexOf('>'))) ? 'disabled' : 'enabled';
}

const iaTab = (access: ActionAccess) =>
  renderToStaticMarkup(
    createElement(IaTab, {
      ia_analysis: IA_ANALYSIS,
      officialChecklist: [],
      onAddDocumentsToChecklist: async () => {},
      isSubmitting: false,
      opportunityId: 'opp-a',
      customerId: 'A',
      tenderDocuments: TENDER_DOCS,
      access,
    }),
  );

const proposal = (userProfile: UserProfile, accountSuspended = false) =>
  renderToStaticMarkup(
    createElement(Proposal, {
      userProfile,
      opportunity: { id: 'opp-a', customer_id: 'A', title: 'Oportunidad' } as unknown as Opportunity,
      proposalDocuments: [],
      proposalDocumentStatuses: { all_statuses: ['Borrador'], default_status: 'Borrador' },
      tenderDocuments: TENDER_DOCS,
      onRefreshData: () => {},
      accountSuspended,
    }),
  );

describe('B16: de dónde sale el estado de la cuenta', () => {
  const suspendida = { estado: 'suspendida' } as const;

  it('lee cuenta de get_my_profile', async () => {
    profileResponse = { status: 200, body: { uid: 'u-1', cuenta: suspendida } };

    assert.deepEqual(await account.fetchAplicaAccount(), suspendida);
  });

  it('un backend sin publicar no trae cuenta y no bloquea nada', async () => {
    const cuenta = await account.fetchAplicaAccount();

    assert.equal(cuenta, null);
    assert.equal(account.isAccountSuspended(cuenta, undefined), false);
  });

  it('un fallo de lectura no bloquea nada', async () => {
    profileResponse = { status: 500, body: { error: 'Error interno.' } };
    assert.equal(await account.fetchAplicaAccount(), null);

    profileResponse = 'network-down';
    assert.equal(await account.fetchAplicaAccount(), null);
  });

  it('basta con que Aplica o Descubre digan suspendida', () => {
    assert.equal(account.isAccountSuspended(suspendida, null), true);
    assert.equal(account.isAccountSuspended(null, suspendida), true);
    assert.equal(account.isAccountSuspended({ estado: 'activa' }, { estado: 'prueba' }), false);
  });

  it('sin permiso gana sobre la suspensión: lo que no se ofrece no se deshabilita', () => {
    assert.equal(account.actionAccess(false, true), 'denied');
    assert.equal(account.actionAccess(true, true), 'suspended');
    assert.equal(account.actionAccess(true, false), 'allowed');
  });

  it('solo RUP, estados financieros y experiencia se rechazan al subir', () => {
    for (const category of ['rup', 'financial_statements', 'experience']) {
      assert.equal(account.uploadBlockedBySuspension(category, true), true, category);
      assert.equal(account.uploadBlockedBySuspension(category, false), false, category);
    }
    assert.equal(account.uploadBlockedBySuspension('other', true), false);
  });
});

describe('B16: aviso de cuenta suspendida', () => {
  const notice = (suspended: boolean) =>
    renderToStaticMarkup(
      createElement(accountContext.AccountContext.Provider, { value: { suspended } }, createElement(Notice)) as ReactElement,
    );

  it('aparece solo con la cuenta suspendida y lleva a contacto', () => {
    assert.match(notice(true), /href="\/contact"/);
    assert.equal(notice(false), '');
  });

  it('su texto sigue marcado como pendiente de aprobación', () => {
    assert.match(readFileSync('src/components/account/AccountSuspendedNotice.tsx', 'utf8'), /PENDIENTE DE APROBACIÓN/);
  });
});

describe('B16: generaciones IA según la cuenta', () => {
  it('con permiso y cuenta al día, todo se ofrece', () => {
    const html = iaTab('allowed');

    assert.equal(button(html, 'Analizar Elegibilidad del Cliente'), 'enabled');
    assert.equal(button(html, 'Generar Observaciones con IA'), 'enabled');
    assert.equal(button(proposal(COLLABORATOR), 'Generar borrador de WBS con IA'), 'enabled');
  });

  it('con la cuenta suspendida se ven deshabilitadas', () => {
    const html = iaTab('suspended');

    assert.equal(button(html, 'Analizar Elegibilidad del Cliente'), 'disabled');
    assert.equal(button(html, 'Generar Observaciones con IA'), 'disabled');
    assert.equal(button(proposal(COLLABORATOR, true), 'Generar borrador de WBS con IA'), 'disabled');
  });

  it('añadir al checklist no es una generación: sigue activo con la cuenta suspendida', () => {
    assert.match(iaTab('suspended'), /Documento\(s\) al Checklist Oficial/);
  });
});

describe('R6: al lector no se le ofrece lo que niega la matriz', () => {
  it('no lanza WBS, sea lector o no tenga rol', () => {
    assert.equal(button(proposal(READER), 'Generar borrador de WBS con IA'), 'absent');
    assert.equal(button(proposal(NO_ROLE), 'Generar borrador de WBS con IA'), 'absent');
  });

  it('no lanza observaciones ni elegibilidad', () => {
    const html = iaTab('denied');

    assert.equal(button(html, 'Analizar Elegibilidad del Cliente'), 'absent');
    assert.equal(button(html, 'Generar Observaciones con IA'), 'absent');
  });

  it('no edita el checklist de la oportunidad, pero sigue leyendo el análisis', () => {
    const html = iaTab('denied');

    assert.doesNotMatch(html, /al Checklist Oficial/);
    assert.match(html, /Requisito/);
  });

  it('no vincula ni desvincula certificaciones; quien colabora sí', () => {
    const row = (contract: Partial<RupContract>, canLink: boolean) =>
      renderToStaticMarkup(
        createElement(Row, {
          contract: { id: 'c-1', rup_consecutive: 1, ...contract } as RupContract,
          canLink,
          onLinkClick: () => {},
          onUnlinkClick: () => {},
        }),
      );
    const linked = { certification_doc_id: 'doc-a', certification: { id: 'doc-a' } } as unknown as Partial<RupContract>;

    assert.match(row({}, true), /Vincular/);
    assert.doesNotMatch(row({}, false), /Vincular/);
    assert.match(row(linked, true), /Desvincular certificación/);
    assert.doesNotMatch(row(linked, false), /Desvincular certificación/);
  });

  it('en la adenda solo lee: sin acciones y al cerrar no escribe', () => {
    const modal = readFileSync('src/components/opportunities/AdendaReviewModal.tsx', 'utf8');

    assert.match(modal, /if \(!canApply\) return null;/);
    assert.match(modal, /if \(!canApply\) \{\s*onOpenChange\(false\);\s*return;/);
    assert.match(
      readFileSync('src/app/dashboard/customers/[customerId]/opportunities/[opportunityId]/page.tsx', 'utf8'),
      /<AdendaReviewModal[\s\S]*?canApply=\{canCollaborate\}/,
    );
  });
});

describe('B16: pantallas que usan el estado de la cuenta', () => {
  const customerPage = () => readFileSync('src/app/dashboard/customers/[customerId]/page.tsx', 'utf8');

  it('el portal carga la cuenta y muestra el aviso', () => {
    const layout = readFileSync('src/app/dashboard/layout.tsx', 'utf8');

    assert.match(layout, /<AccountProvider>/);
    assert.match(layout, /<AccountSuspendedNotice \/>/);
  });

  it('los dos botones de analizar pliego se deshabilitan', () => {
    const buttons = customerPage().match(/<Button[^>]*onClick=\{handleOpenAnalysisModal\}[^>]*>/g) ?? [];

    assert.equal(buttons.length, 2);
    for (const tag of buttons) assert.match(tag, /disabled=\{accountSuspended\}/);
  });

  it('re-extraer, actualizar contratos y subir respetan la suspensión', () => {
    const page = customerPage();

    assert.match(page, /onClick=\{handleFill\}\s*disabled=\{isFilling \|\| accountSuspended\}/);
    assert.match(page, /onClick=\{handleReextract\}\s*disabled=\{\s*accountSuspended \|\|/);
    assert.match(page, /uploadBlockedBySuspension\(doc\.category, accountSuspended\)/);
    assert.match(page, /disabled=\{uploadBlockedBySuspension\(key, accountSuspended\)\}/);
  });

  it('el lector no ve los botones de vincular de la zona', () => {
    assert.match(customerPage(), /<RupContractsWidget[^>]*canLink=\{canCreateAndEdit\}/);
  });

  it('Descubre deshabilita sugerencias y suscripción', () => {
    const page = readFileSync('src/app/dashboard/descubre/perfil/page.tsx', 'utf8');

    assert.match(page, /disabled=\{suggesting \|\| saving \|\| accountSuspended\}/);
    assert.match(page, /disabled=\{limiteAlcanzado \|\| !!actionInProgress \|\| accountSuspended\}/);
  });
});
