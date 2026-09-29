/**
 * Browser Storage Abstraction Foundation
 * 
 * Provides safe, synchronous-equivalent storage for session and UI preferences.
 * Designed as the architectural foundation for future IndexedDB / offline data synchronization.
 * 
 * NOTE: For local mock/demo authentication only. Not for production security.
 */

export interface BrowserDataStore {
  get<T>(key: string, fallback?: T): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
}

class LocalStorageAdapter implements BrowserDataStore {
  private isAvailable: boolean;
  private memoryFallback: Map<string, string>;

  constructor() {
    this.memoryFallback = new Map<string, string>();
    this.isAvailable = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  get<T>(key: string, fallback?: T): T | null {
    try {
      if (this.isAvailable) {
        const item = window.localStorage.getItem(key);
        if (item === null) return fallback ?? null;
        return JSON.parse(item) as T;
      } else {
        const item = this.memoryFallback.get(key);
        if (!item) return fallback ?? null;
        return JSON.parse(item) as T;
      }
    } catch (err) {
      console.warn(`[browserStorage] Failed to read key "${key}":`, err);
      return fallback ?? null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      const serialized = JSON.stringify(value);
      if (this.isAvailable) {
        window.localStorage.setItem(key, serialized);
      } else {
        this.memoryFallback.set(key, serialized);
      }
    } catch (err) {
      console.warn(`[browserStorage] Failed to write key "${key}":`, err);
    }
  }

  remove(key: string): void {
    try {
      if (this.isAvailable) {
        window.localStorage.removeItem(key);
      } else {
        this.memoryFallback.delete(key);
      }
    } catch (err) {
      console.warn(`[browserStorage] Failed to remove key "${key}":`, err);
    }
  }

  clear(): void {
    try {
      if (this.isAvailable) {
        window.localStorage.clear();
      } else {
        this.memoryFallback.clear();
      }
    } catch (err) {
      console.warn('[browserStorage] Failed to clear storage:', err);
    }
  }
}

export const browserStorage: BrowserDataStore = new LocalStorageAdapter();
export const SESSION_STORAGE_KEY = 'aiia_ctms_session';
