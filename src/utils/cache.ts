export class Cache {
  private inMemoryDb: Map<string, { value: any; expiry: number }>;

  private static instance: Cache;

  private constructor() {
    this.inMemoryDb = new Map<string, { value: any; expiry: number }>();
  }

  static getInstance() {
    if (!this.instance) {
      this.instance = new Cache();
    }

    return this.instance;
  }

  set(type: string, args: string, value: any, ttl: number) {
    this.inMemoryDb.set(`${type}-${JSON.stringify(args)}`, {
      value,
      expiry: new Date().getTime() + ttl * 1000,
    });
  }

  get(type: string, args: string) {
    const key = `${type}-${JSON.stringify(args)}`;
    const cachedValue = this.inMemoryDb.get(key);

    if (!cachedValue) {
      return null;
    }

    if (new Date().getTime() > cachedValue.expiry) {
      this.inMemoryDb.delete(key);
      return null;
    }

    return cachedValue.value;
  }

  evict(type: string, args: string[]) {
    const key = `${type} ${JSON.stringify(args)}`;
    this.inMemoryDb.delete(key);
    return null;
  }
}
