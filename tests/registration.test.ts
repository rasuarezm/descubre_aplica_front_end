import assert from 'node:assert/strict';
import { before, beforeEach, describe, it } from 'node:test';
import { FirebaseError } from 'firebase/app';
import type { RegistrationAuth } from '@/lib/registration';

// Los clientes API y firebase leen estas variables al importarse; los valores son ficticios.
process.env.NEXT_PUBLIC_API_BASE_URL = '/api-proxy';
process.env.NEXT_PUBLIC_DESCUBRE_API_URL = '/api-descubre-proxy';
process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'test-key';
process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'test-app';

const EMAIL = 'ficticio@example.com';
const PASSWORD = 'clave-de-prueba';

interface FakeUser {
  emailVerified: boolean;
}

type Reply = { status: number; body?: unknown } | 'network-down';

let profileReply: Reply;
let dashboardReply: Reply;
let syncedProfile: Record<string, unknown>;
let profilePosts: Array<Record<string, unknown>>;
let endpoints: string[];

/** Backend falso: responde como los gateways y registra lo que hace el código real. */
const interceptedFetch = async (input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> => {
  const url = String(input);
  endpoints.push(url);
  const reply = (r: Reply) => {
    if (r === 'network-down') throw new TypeError('Failed to fetch');
    return new Response(JSON.stringify(r.body ?? {}), {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  if (url.endsWith('/v1/dashboard_data')) return reply(dashboardReply);
  if (url.endsWith('/create_or_update_user_profile')) return reply({ status: 200, body: { profile_data: syncedProfile } });
  if (url.endsWith('/v1/client_profile')) {
    profilePosts.push(JSON.parse(String(init.body)));
    return reply(profileReply);
  }
  throw new Error(`Llamada inesperada: ${url}`);
};

/** Auth falso con una sola cuenta posible por correo, como Firebase. */
function fakeAuth(options: { accountExists?: boolean; signedIn?: boolean; emailVerified?: boolean; password?: string } = {}) {
  const account: FakeUser = { emailVerified: options.emailVerified ?? false };
  const state = {
    accountExists: options.accountExists ?? false,
    session: options.signedIn ? account : null as FakeUser | null,
    accountsCreated: 0,
    signIns: 0,
    verificationEmails: 0,
    failVerification: false,
  };
  const auth: RegistrationAuth<FakeUser> = {
    currentUser: () => state.session,
    createUser: async () => {
      if (state.accountExists) throw new FirebaseError('auth/email-already-in-use', 'in use');
      state.accountExists = true;
      state.accountsCreated += 1;
      state.session = account;
      return account;
    },
    signIn: async (_email, password) => {
      if (password !== (options.password ?? PASSWORD)) throw new FirebaseError('auth/invalid-credential', 'bad');
      state.signIns += 1;
      state.session = account;
      return account;
    },
    sendVerification: async () => {
      if (state.failVerification) throw new FirebaseError('auth/too-many-requests', 'slow down');
      state.verificationEmails += 1;
    },
  };
  return { auth, state };
}

let registration: typeof import('@/lib/registration');
let tokens = 0;

const input = () => ({
  email: EMAIL,
  password: PASSWORD,
  buildProfile: async () => {
    tokens += 1;
    return { nombre_empresa: 'Empresa ficticia', recaptcha_token: `token-${tokens}` };
  },
});

before(async () => {
  const { auth } = await import('@/lib/firebase');
  Object.defineProperty(auth, 'currentUser', { value: { getIdToken: async () => 'test-token' } });
  globalThis.fetch = interceptedFetch as typeof fetch;
  registration = await import('@/lib/registration');
});

beforeEach(() => {
  profileReply = { status: 201, body: { success: true } };
  dashboardReply = { status: 404, body: { error: 'Perfil de cliente no encontrado.' } };
  syncedProfile = { uid: 'uid-a', role: 'customer', customer_id: null };
  profilePosts = [];
  endpoints = [];
});

describe('B20: el alta se reanuda', () => {
  it('alta normal: una cuenta, un perfil, un correo', async () => {
    const { auth, state } = fakeAuth();

    const result = await registration.registerOrResume(auth, input());

    assert.deepEqual(result, { outcome: 'created', verificationSent: true });
    assert.equal(state.accountsCreated, 1);
    assert.equal(profilePosts.length, 1);
    assert.equal(state.verificationEmails, 1);
  });

  it('perfil con 500: no envía correo; reintentar en la misma pestaña no crea otra cuenta', async () => {
    const { auth, state } = fakeAuth();
    profileReply = { status: 500, body: { error: 'Error interno al crear el perfil.' } };

    await assert.rejects(registration.registerOrResume(auth, input()), /Error interno/);
    assert.equal(state.verificationEmails, 0);

    profileReply = { status: 201 };
    const result = await registration.registerOrResume(auth, input());

    assert.equal(result.outcome, 'created');
    assert.equal(state.accountsCreated, 1);
    assert.equal(profilePosts.length, 2);
    assert.equal(state.verificationEmails, 1);
  });

  it('cada intento manda un token de reCAPTCHA nuevo', async () => {
    const { auth } = fakeAuth();
    profileReply = { status: 500 };
    await assert.rejects(registration.registerOrResume(auth, input()));

    profileReply = { status: 201 };
    await registration.registerOrResume(auth, input());

    assert.notEqual(profilePosts[0].recaptcha_token, profilePosts[1].recaptcha_token);
  });

  it('vuelve otro día con el mismo correo: entra y completa el perfil, sin otra cuenta', async () => {
    const { auth, state } = fakeAuth({ accountExists: true });

    const result = await registration.registerOrResume(auth, input());

    assert.equal(result.outcome, 'created');
    assert.equal(state.accountsCreated, 0);
    assert.equal(state.signIns, 1);
    assert.equal(profilePosts.length, 1);
  });

  it('correo ya verificado: completa el perfil sin enviar nada', async () => {
    const { auth, state } = fakeAuth({ accountExists: true, emailVerified: true });

    const result = await registration.registerOrResume(auth, input());

    assert.deepEqual(result, { outcome: 'created', verificationSent: false });
    assert.equal(state.verificationEmails, 0);
  });

  it('si el correo de verificación falla, el perfil creado no se pierde', async () => {
    const { auth, state } = fakeAuth();
    state.failVerification = true;

    const result = await registration.registerOrResume(auth, input());

    assert.deepEqual(result, { outcome: 'created', verificationSent: false });
  });
});

describe('B20: no toca cuentas que no le corresponden', () => {
  it('cuenta completa: entra sin crear perfil ni enviar correo', async () => {
    const { auth, state } = fakeAuth({ accountExists: true });
    dashboardReply = { status: 200, body: {} };

    const result = await registration.registerOrResume(auth, input());

    assert.deepEqual(result, { outcome: 'already_complete' });
    assert.equal(profilePosts.length, 0);
    assert.equal(state.verificationEmails, 0);
  });

  it('miembro de un cliente sin perfil de Descubre: no le crea una empresa nueva', async () => {
    const { auth } = fakeAuth({ accountExists: true });
    syncedProfile = { uid: 'uid-a', role: 'customer', customer_id: 'customer-a' };

    const result = await registration.registerOrResume(auth, input());

    assert.deepEqual(result, { outcome: 'already_complete' });
    assert.equal(profilePosts.length, 0);
  });

  it('administrador de Bidtory: tampoco', async () => {
    const { auth } = fakeAuth({ accountExists: true });
    syncedProfile = { uid: 'uid-a', role: 'admin', customer_id: null };

    assert.deepEqual(await registration.registerOrResume(auth, input()), { outcome: 'already_complete' });
    assert.equal(profilePosts.length, 0);
  });

  it('contraseña equivocada: explica cómo seguir y no hace nada más', async () => {
    const { auth, state } = fakeAuth({ accountExists: true, password: 'otra-clave' });

    await assert.rejects(registration.registerOrResume(auth, input()), registration.ExistingAccountError);

    assert.equal(state.session, null);
    assert.deepEqual(endpoints, []);
    assert.equal(state.verificationEmails, 0);
  });

  it('sin poder leer el estado no crea nada: un fallo no equivale a «sin perfil»', async () => {
    const { auth, state } = fakeAuth({ accountExists: true });
    dashboardReply = { status: 500, body: { error: 'Error interno.' } };

    await assert.rejects(registration.registerOrResume(auth, input()));

    assert.equal(profilePosts.length, 0);
    assert.equal(state.verificationEmails, 0);
  });

  it('un 409 al crear es éxito: la respuesta anterior se perdió, y no se reenvía correo', async () => {
    const { auth, state } = fakeAuth({ signedIn: true, accountExists: true });
    profileReply = { status: 409, body: { error: 'El perfil de cliente para este usuario ya existe.' } };

    const result = await registration.registerOrResume(auth, input());

    assert.deepEqual(result, { outcome: 'already_complete' });
    assert.equal(state.verificationEmails, 0);
  });
});

describe('B20: quién debe completar el registro', () => {
  const cases: Array<[string, { role: 'customer' | 'admin'; customer_id: string | null } | null, boolean, boolean]> = [
    ['pendiente sin perfil de Descubre', { role: 'customer', customer_id: null }, true, true],
    ['pendiente cuyo perfil no se pudo leer', { role: 'customer', customer_id: null }, false, false],
    ['miembro de un cliente', { role: 'customer', customer_id: 'customer-a' }, true, false],
    ['administrador', { role: 'admin', customer_id: null }, true, false],
    ['perfil aún sin cargar', null, true, false],
  ];

  for (const [name, profile, missing, expected] of cases) {
    it(name, () => {
      assert.equal(registration.needsRegistrationCompletion(profile, missing), expected);
    });
  }
});
