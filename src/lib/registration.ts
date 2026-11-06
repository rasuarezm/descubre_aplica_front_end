import { FirebaseError } from 'firebase/app';
import apiClient from '@/lib/api-client';
import descubreApiClient, { ApiError } from '@/lib/descubre-api-client';
import { normalizeUserProfile } from '@/lib/user-profile';
import type { UserProfile } from '@/types';

export type RegistrationState = 'complete' | 'incomplete';

interface VerifiableUser {
  emailVerified: boolean;
}

export interface RegistrationAuth<U extends VerifiableUser> {
  currentUser: () => U | null;
  createUser: (email: string, password: string) => Promise<U>;
  signIn: (email: string, password: string) => Promise<U>;
  sendVerification: (user: U) => Promise<void>;
}

export interface RegistrationInput<P> {
  email: string;
  password: string;
  /** El token de reCAPTCHA es de un solo uso: cada intento arma el suyo. */
  buildProfile: () => Promise<P>;
}

export type RegistrationResult =
  | { outcome: 'created'; verificationSent: boolean }
  | { outcome: 'already_complete' };

/** Correo con cuenta en Auth, pero la contraseña escrita no es la suya. */
export class ExistingAccountError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExistingAccountError';
  }
}

/** La cuenta ya pertenece a otra empresa o al equipo Bidtory: no hay registro que completar. */
export class AlreadyMemberError extends Error {
  constructor() {
    super('Esta cuenta ya pertenece a una empresa o al equipo de Bidtory y no puede registrar otra. Si necesita acceso, pídalo a su administrador.');
    this.name = 'AlreadyMemberError';
  }
}

const WRONG_CREDENTIAL_CODES = ['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found'];

/** Un usuario sin vínculo a un cliente y sin perfil de Descubre no terminó de registrarse. */
export function needsRegistrationCompletion(
  profile: Pick<UserProfile, 'role' | 'customer_id'> | null,
  clientProfileMissing: boolean,
): boolean {
  return clientProfileMissing && profile?.role === 'customer' && !profile.customer_id;
}

/** Un fallo de lectura se propaga: no saber el estado no es lo mismo que no tener perfil. */
export async function getRegistrationState(): Promise<RegistrationState> {
  try {
    await descubreApiClient.get('/v1/dashboard_data');
    return 'complete';
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
  }
  const res = await apiClient.post<{ profile_data?: unknown }>('/create_or_update_user_profile', {
    trigger_sync: true,
  });
  const profile = normalizeUserProfile(res.profile_data);
  return needsRegistrationCompletion(profile, true) ? 'incomplete' : 'complete';
}

async function signInExistingAccount<U extends VerifiableUser>(
  auth: RegistrationAuth<U>,
  email: string,
  password: string,
): Promise<U> {
  try {
    return await auth.signIn(email, password);
  } catch (error) {
    if (error instanceof FirebaseError && WRONG_CREDENTIAL_CODES.includes(error.code)) {
      throw new ExistingAccountError(
        'Este correo ya tiene una cuenta y la contraseña no coincide. Inicie sesión o restablezca su contraseña para completar el registro.',
      );
    }
    throw error;
  }
}

/**
 * Alta reanudable: entra a la cuenta de Auth que exista y crea el perfil solo si falta.
 * El correo de verificación sale una vez, cuando el perfil se crea; un reintento no lo repite.
 */
export async function registerOrResume<U extends VerifiableUser, P>(
  auth: RegistrationAuth<U>,
  input: RegistrationInput<P>,
): Promise<RegistrationResult> {
  let user = auth.currentUser();
  let isNewAccount = false;

  if (!user) {
    try {
      user = await auth.createUser(input.email, input.password);
      isNewAccount = true;
    } catch (error) {
      if (!(error instanceof FirebaseError) || error.code !== 'auth/email-already-in-use') throw error;
      user = await signInExistingAccount(auth, input.email, input.password);
    }
  }

  if (!isNewAccount && (await getRegistrationState()) === 'complete') {
    return { outcome: 'already_complete' };
  }

  try {
    await descubreApiClient.post('/v1/client_profile', await input.buildProfile());
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      if (error.data?.reason === 'already_member') throw new AlreadyMemberError();
      // La respuesta anterior pudo perderse después de crear el perfil. Un backend sin B36 no manda reason.
      return { outcome: 'already_complete' };
    }
    throw error;
  }

  if (user.emailVerified) return { outcome: 'created', verificationSent: false };
  try {
    await auth.sendVerification(user);
    return { outcome: 'created', verificationSent: true };
  } catch (error) {
    console.warn('No se pudo enviar el correo de verificación:', error);
    return { outcome: 'created', verificationSent: false };
  }
}
