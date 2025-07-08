import { describe, it, expect } from 'vitest';

describe('Sistema Base', () => {
  it('verifica che il testing funzioni', () => {
    expect(2 + 2).toBe(4);
  });

  it('verifica che gli oggetti siano gestiti correttamente', () => {
    const user = { name: 'Test', age: 25 };
    expect(user).toHaveProperty('name');
    expect(user.name).toBe('Test');
  });
});
