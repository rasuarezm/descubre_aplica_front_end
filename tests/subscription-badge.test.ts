import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { subscriptionBadgeEntry } from '@/lib/subscription-badge';

describe('B16: insignia de suscripción del panel de administración', () => {
  it('una suspensión manual no cae en «Sin datos»', () => {
    assert.equal(subscriptionBadgeEntry('suspendido').label, 'Suspendido');
  });

  it('un estado desconocido o vacío sigue siendo «Sin datos»', () => {
    assert.equal(subscriptionBadgeEntry('otro').label, 'Sin datos');
    assert.equal(subscriptionBadgeEntry(null).label, 'Sin datos');
    assert.equal(subscriptionBadgeEntry(undefined).label, 'Sin datos');
  });

  it('los estados que ya había conservan su etiqueta', () => {
    assert.equal(subscriptionBadgeEntry('vencido').label, 'Vencido');
    assert.equal(subscriptionBadgeEntry('prueba_gratuita').label, 'Prueba');
  });
});
