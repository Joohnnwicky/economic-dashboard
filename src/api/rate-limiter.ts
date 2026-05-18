interface RateLimitConfig {
  maxCallsPerDay: number;
  minIntervalMs: number;
  cacheTtlMs: number;
}

class RateLimiter {
  private lastCallTime: Record<string, number> = {};

  async call<T>(
    api: string,
    fn: () => Promise<T>,
    config: RateLimitConfig
  ): Promise<T> {
    const now = Date.now();
    const elapsed = now - (this.lastCallTime[api] || 0);

    if (elapsed < config.minIntervalMs) {
      await new Promise((resolve) =>
        setTimeout(resolve, config.minIntervalMs - elapsed)
      );
    }

    this.lastCallTime[api] = Date.now();
    console.log(`[${api}] API call made`);

    return fn();
  }
}

export const rateLimiter = new RateLimiter();