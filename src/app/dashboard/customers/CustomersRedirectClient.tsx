"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CustomersRedirectClient() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.28))]">
      <p>Redirigiendo al panel...</p>
    </div>
  );
}