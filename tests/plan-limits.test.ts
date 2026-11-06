import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fuentesActivasLabel, isLimitReached, limitLabel } from '@/lib/plan-limits';

describe('B17: un límite puede ser «sin_limite»', () => {
  it('muestra el tope numérico o «sin límite», nunca la clave interna', () => {
    assert.equal(limitLabel(20), 'máx. 20');
    assert.equal(limitLabel('sin_limite'), 'sin límite');
  });

  it('«sin_limite» nunca se alcanza', () => {
    assert.equal(isLimitReached(5000, 'sin_limite'), false);
    assert.equal(isLimitReached(3, 3), true);
    assert.equal(isLimitReached(2, 3), false);
  });

  it('el 0 sigue bloqueando, como cuando faltaba el valor', () => {
    assert.equal(isLimitReached(0, 0), true);
  });

  it('el contador de fuentes se lee bien en los dos casos', () => {
    assert.equal(fuentesActivasLabel(5), 'de 5 fuente(s) activa(s) en su plan');
    assert.equal(fuentesActivasLabel('sin_limite'), 'fuente(s) activa(s) en su plan, sin límite');
  });

  it('el perfil no pinta un límite sin pasar por las etiquetas', () => {
    const page = readFileSync('src/app/dashboard/descubre/perfil/page.tsx', 'utf8');

    assert.doesNotMatch(page, /máx\. \{/);
    assert.doesNotMatch(page, /de \{maxFuentes\}/);
    assert.doesNotMatch(page, />= maxFuentes/);
  });
});
