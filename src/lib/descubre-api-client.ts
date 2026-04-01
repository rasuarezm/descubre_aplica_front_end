
import { auth } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_DESCUBRE_API_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_DESCUBRE_API_URL environment variable");
}

class ApiError extends Error {
  constructor(message: string, public status: number, public data: any = null) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const idToken = await auth.currentUser?.getIdToken();

  const headers = new Headers(options.headers || {});
  if (idToken) {
    headers.set('Authorization', `Bearer ${idToken}`);
  }
  
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
    cache: 'no-store', // Ensures fresh data from the API
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (response.status === 401) {
    // This can be enhanced later to trigger a global logout
    window.location.href = '/login';
    throw new ApiError('No autorizado. Redirigiendo al login...', 401);
  }

  if (!response.ok) {
    const raw = await response.text().catch(() => '');
    let errorData: Record<string, unknown> & { message?: string } = {
      message: `HTTP error! status: ${response.status}`,
    };
    try {
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        errorData = { ...errorData, ...parsed };
        const msg =
          (typeof parsed.message === 'string' && parsed.message) ||
          (typeof parsed.error === 'string' && parsed.error);
        if (msg) errorData.message = msg;
      }
    } catch {
      if (raw) errorData.message = raw.slice(0, 300);
    }
    throw new ApiError(
      (typeof errorData.message === 'string' && errorData.message) ||
        'Ocurrió un error en la petición',
      response.status,
      errorData
    );
  }
  
  // Handle cases where the response might be empty (e.g., 204 No Content)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json() as Promise<T>;
  }
  return Promise.resolve(undefined as T);
}

const descubreApiClient = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, body: any, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),

  patch: <T>(endpoint: string, body: any, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(endpoint: string, body?: any, options?: RequestInit) => 
    request<T>(endpoint, { ...options, method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};

export default descubreApiClient;
export { ApiError };
