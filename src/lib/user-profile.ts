import type { UserProfile } from '@/types';

function firstString(d: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = d[k];
    if (typeof v === 'string' && v.length > 0) {
      return v;
    }
  }
  return undefined;
}

/**
 * Solo HTTPS apto para <img src> (GCS firmado, Google, Firebase Storage).
 * Rechaza S3 y otros hosts que suelen devolver 403 en el navegador.
 */
export function sanitizeAvatarHttpsUrl(url: string | null | undefined): string | undefined {
  if (!url || typeof url !== 'string') return undefined;
  const s = url.trim();
  if (!s.startsWith('http')) return undefined;
  try {
    const host = new URL(s).hostname.toLowerCase();
    if (host.includes('amazonaws.com') || host.includes('cloudfront.net')) return undefined;
    if (
      host.includes('storage.googleapis.com') ||
      host.includes('googleusercontent.com') ||
      host.includes('firebasestorage.googleapis.com')
    ) {
      return s;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/** URL para avatar: priorizar photo_signed_url del backend; Auth photoURL puede ser S3 legacy. */
export function avatarUrlForImg(
  photoSignedUrl: string | null | undefined,
  fallbackPhotoUrl: string | null | undefined
): string {
  const a = sanitizeAvatarHttpsUrl(photoSignedUrl);
  if (a) return a;
  const b = sanitizeAvatarHttpsUrl(fallbackPhotoUrl);
  return b ?? '';
}

export function safeFirebasePhotoUrlForAvatar(userPhotoUrl: string | null | undefined): string {
  return sanitizeAvatarHttpsUrl(userPhotoUrl) ?? '';
}

/**
 * Unifica la forma del perfil que devuelve Flask (snake_case, a veces `displayname` en minúsculas)
 * para que el front siempre tenga `displayName` y `photo_signed_url`.
 */
export function normalizeUserProfile(raw: unknown): UserProfile | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const d = raw as Record<string, unknown>;
  const uid = d.uid != null ? String(d.uid) : '';
  if (!uid) {
    return null;
  }

  const role: UserProfile['role'] =
    d.role === 'admin' || d.role === 'customer' ? d.role : 'customer';

  const rawSigned = firstString(d, ['photo_signed_url', 'photoSignedUrl']);
  const photo_signed_url = sanitizeAvatarHttpsUrl(rawSigned);
  const displayName = firstString(d, ['displayName', 'displayname', 'display_name']) ?? '';
  const email = firstString(d, ['email']) ?? '';

  return {
    uid,
    role,
    customer_id: (d.customer_id as string | null | undefined) ?? null,
    customer_role: d.customer_role as UserProfile['customer_role'] | undefined,
    displayName,
    email,
    photo_url: firstString(d, ['photoURL', 'photo_url', 'photoUrl']),
    photo_signed_url: photo_signed_url ?? undefined,
    notification_preferences: d.notification_preferences as UserProfile['notification_preferences'],
    terms_accepted_at: (d.terms_accepted_at as string | null | undefined) ?? null,
  };
}
