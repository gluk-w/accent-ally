// Rate limiting configuration
const RATE_LIMIT = 10; // requests per hour
const HOUR_IN_MS = 60 * 60 * 1000;

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();

  // Clean up expired entries periodically
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    Array.from(this.requests.keys()).forEach(ip => {
      const entry = this.requests.get(ip);
      if (entry && now > entry.resetTime) {
        this.requests.delete(ip);
      }
    });
  }

  isRateLimited(ip: string): boolean {
    const now = Date.now();
    const clientRequests = this.requests.get(ip);

    // Clean up expired entries periodically
    this.cleanupExpiredEntries();

    // If no previous requests or expired, create new entry
    if (!this.requests.has(ip)) {
      this.requests.set(ip, {
        count: 1,
        resetTime: now + HOUR_IN_MS,
      });
      return false;
    }

    // Check if rate limit exceeded
    const entry = this.requests.get(ip)!;
    if (entry.count >= RATE_LIMIT) {
      return true;
    }

    // Increment request count
    entry.count++;
    return false;
  }

  getRemainingRequests(ip: string): number {
    const entry = this.requests.get(ip);
    if (!entry || Date.now() > entry.resetTime) {
      return RATE_LIMIT;
    }
    return Math.max(0, RATE_LIMIT - entry.count);
  }

  getResetTime(ip: string): number | null {
    const entry = this.requests.get(ip);
    return entry ? entry.resetTime : null;
  }
}

export const RATE_LIMIT_HEADERS = {
  REMAINING: 'X-RateLimit-Remaining',
  LIMIT: 'X-RateLimit-Limit',
  RESET: 'X-RateLimit-Reset'
} as const;