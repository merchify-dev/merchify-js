export class SignatureCache {
  private cache = new Map<string, string>();

  constructor() {
    // No initialization needed for test mock
  }

  get(key: string): string | null {
    return this.cache.get(key) || null;
  }

  set(key: string, value: string): void {
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

export default SignatureCache;
