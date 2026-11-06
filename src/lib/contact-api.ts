import apiClient from '@/lib/api-client';

export interface ContactFormPayload {
  fullName: string;
  companyName: string;
  email: string;
  interest: string;
  message: string;
  recaptchaToken: string;
}

export function sendContactForm(payload: ContactFormPayload): Promise<void> {
  return apiClient.post('/handle_contact_form', payload);
}
