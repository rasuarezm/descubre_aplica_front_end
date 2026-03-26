
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const COOKIE_CONSENT_KEY = 'cookie_consent_preferences';

export interface CookiePreferences {
  essential: boolean;
  analytics: boolean;
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
};

export function getCookieConsentValue(type: keyof CookiePreferences = 'analytics'): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const savedPrefs = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (savedPrefs) {
    try {
      const prefs = JSON.parse(savedPrefs) as CookiePreferences;
      return prefs[type] === true;
    } catch (e) {
      return false;
    }
  }
  return false;
}

export function CookieConsent() {
  const [isBannerVisible, setIsBannerVisible] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    if (localStorage.getItem(COOKIE_CONSENT_KEY) === null) {
      setIsBannerVisible(true);
    } else {
      setPreferences(JSON.parse(localStorage.getItem(COOKIE_CONSENT_KEY)!));
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setIsBannerVisible(false);
    setIsDialogOpen(false);
    // Reload to apply changes (e.g., load analytics script)
    window.location.reload();
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = { essential: true, analytics: true };
    setPreferences(allAccepted);
    savePreferences(allAccepted);
  };

  const handleSavePreferences = () => {
    savePreferences(preferences);
  };
  
  const handleRejectAll = () => {
    const allRejected: CookiePreferences = { essential: true, analytics: false };
    setPreferences(allRejected);
    savePreferences(allRejected);
  };

  if (!isBannerVisible) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border shadow-2xl animate-in slide-in-from-bottom-5">
        <div className="container mx-auto px-4 py-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3 text-sm text-foreground/80">
              <Cookie className="h-5 w-5 mt-0.5 shrink-0 text-highlight" />
              <p>
                Utilizamos cookies para mejorar su experiencia y analizar el tráfico. Puede personalizar sus preferencias o aceptarlas todas. Consulte nuestra{' '}
                <Link href="/privacy-policy" className="underline hover:text-accent">
                  Política de Privacidad
                </Link>
                .
              </p>
            </div>
            <div className="flex gap-3 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
                Personalizar
              </Button>
              <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleAcceptAll}>
                Aceptar Todas
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preferencias de Cookies</DialogTitle>
            <DialogDescription>
              Administre sus preferencias de cookies. Puede habilitar o deshabilitar las categorías a continuación.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="essential-cookies" className="font-medium">Cookies Esenciales</Label>
                <p className="text-xs text-muted-foreground">
                  Estas cookies son necesarias para el funcionamiento del sitio y no se pueden desactivar.
                </p>
              </div>
              <Switch id="essential-cookies" checked disabled />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="analytics-cookies" className="font-medium">Cookies de Análisis</Label>
                <p className="text-xs text-muted-foreground">
                  Estas cookies nos permiten medir el tráfico y mejorar el rendimiento del sitio.
                </p>
              </div>
              <Switch
                id="analytics-cookies"
                checked={preferences.analytics}
                onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, analytics: checked }))}
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleRejectAll}>Rechazar Todas</Button>
            <Button variant="secondary" onClick={handleSavePreferences}>Guardar Preferencias</Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handleAcceptAll}>Aceptar Todas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
