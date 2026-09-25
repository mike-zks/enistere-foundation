import { applyDesignTheme, type ThemeHost } from './runtime-theme';

class MemoryHost implements ThemeHost {
  readonly values = new Map<string, string>();
  getAttribute(name: string): string | null { return this.values.get(name) ?? null; }
  setAttribute(name: string, value: string): void { this.values.set(name, value); }
}

describe('runtime design theme', () => {
  it('selects a registered institution/context pack and mode', () => {
    const host = new MemoryHost();
    host.setAttribute('data-enistere-institution', 'sunrise');
    host.setAttribute('data-theme-context', 'learning');
    host.setAttribute('data-theme', 'dark');
    expect(applyDesignTheme(host)).toEqual({ packId: 'sunrise-institute', mode: 'dark', contextId: 'learning' });
  });

  it('falls back safely for an unknown institution', () => {
    const host = new MemoryHost();
    host.setAttribute('data-enistere-institution', 'unknown');
    expect(applyDesignTheme(host).packId).toBe('enistere-default');
  });
});
