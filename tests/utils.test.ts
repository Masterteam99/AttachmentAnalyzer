import { describe, it, expect } from 'vitest';
// Esempio di funzione da testare (da sostituire con una reale)
function sum(a: number, b: number) {
  return a + b;
}

describe('sum', () => {
  it('somma due numeri', () => {
    expect(sum(2, 3)).toBe(5);
  });
});
