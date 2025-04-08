import { CACHE_CONFIG } from "../config/constants";

interface CachedSignature {
  url: string;
  signature: string;
  timestamp: number;
}

export class SignatureCache {
  private cache: Map<string, CachedSignature>;
  private maxSize: number;
  private useLocalStorage: boolean;
  private storageMaxSize: number;

  constructor(maxSize: number = CACHE_CONFIG.MEMORY_CACHE_SIZE) {
    this.maxSize = maxSize;
    this.storageMaxSize = CACHE_CONFIG.STORAGE_CACHE_SIZE;
    this.cache = new Map();
    this.useLocalStorage = this.checkLocalStorageAvailability();
    this.loadFromStorage();
  }

  /**
   * Check if localStorage is available and has space
   */
  private checkLocalStorageAvailability(): boolean {
    try {
      const testKey = "__merchify_storage_test__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      console.warn(
        "localStorage is not available, falling back to in-memory cache:",
        e,
      );
      return false;
    }
  }

  private loadFromStorage() {
    if (!this.useLocalStorage) {
      return;
    }

    try {
      const stored = localStorage.getItem(CACHE_CONFIG.SIGNATURE_CACHE_KEY);
      if (stored) {
        const entries = JSON.parse(stored) as CachedSignature[];
        // Load only the most recent entries up to storageMaxSize
        entries
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.storageMaxSize)
          .forEach((entry) => {
            this.cache.set(entry.url, entry);
          });
      }
    } catch (error) {
      console.warn("Failed to load signature cache from localStorage:", error);
      // On error, we'll just use the empty in-memory cache
      this.useLocalStorage = false;
    }
  }

  private saveToStorage() {
    if (!this.useLocalStorage) {
      return;
    }

    try {
      const entries = Array.from(this.cache.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, this.storageMaxSize); // Only store up to storageMaxSize entries
      localStorage.setItem(
        CACHE_CONFIG.SIGNATURE_CACHE_KEY,
        JSON.stringify(entries),
      );
    } catch (error) {
      console.warn("Failed to save signature cache to localStorage:", error);
      // If we fail to save, disable localStorage for future attempts
      this.useLocalStorage = false;
    }
  }

  get(url: string): string | null {
    const entry = this.cache.get(url);
    if (entry) {
      // Update timestamp on access
      entry.timestamp = Date.now();
      this.saveToStorage(); // Will only attempt if localStorage is available
      return entry.signature;
    }
    return null;
  }

  set(url: string, signature: string) {
    // If cache is at capacity, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldest = Array.from(this.cache.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp,
      )[0];
      if (oldest) {
        this.cache.delete(oldest[0]);
      }
    }

    this.cache.set(url, {
      url,
      signature,
      timestamp: Date.now(),
    });

    this.saveToStorage(); // Will only attempt if localStorage is available
  }

  /**
   * Get current cache stats
   */
  getStats() {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map((e) => e.timestamp);
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      persistenceEnabled: this.useLocalStorage,
      persistenceMaxSize: this.storageMaxSize,
      oldestEntry: timestamps.length ? Math.min(...timestamps) : null,
      newestEntry: timestamps.length ? Math.max(...timestamps) : null,
    };
  }
}
