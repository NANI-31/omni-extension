/**
 * StorageAdapter
 * Centralized typed driver adapter for Chrome Extension storage & local fallbacks.
 * Features:
 *  - In-memory synchronous cache for sub-millisecond reads & optimistic writes
 *  - Automatic JSON serialization / deserialization
 *  - Schema migrations & normalized storage listeners
 */

class StorageAdapter {
  constructor() {
    this.memoryCache = new Map();
    this.listeners = new Set();
    this.initialized = false;
    this._initStorage();
  }

  /** Initialize storage adapter and hook storage listener */
  _initStorage() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(null, (items) => {
        if (items) {
          Object.entries(items).forEach(([k, v]) => this.memoryCache.set(k, v));
        }
        this.initialized = true;
      });

      chrome.storage.onChanged.addListener((changes, areaName) => {
        Object.entries(changes).forEach(([key, change]) => {
          this.memoryCache.set(key, change.newValue);
        });
        this.listeners.forEach((listener) => listener(changes, areaName));
      });
    } else {
      this.initialized = true;
    }
  }

  /** Synchronous read from in-memory cache with fallback */
  getSync(key, defaultValue = undefined) {
    if (this.memoryCache.has(key)) {
      return this.memoryCache.get(key);
    }
    if (typeof localStorage !== "undefined") {
      try {
        const item = localStorage.getItem(key);
        if (item !== null) return JSON.parse(item);
      } catch (e) {}
    }
    return defaultValue;
  }

  /** Async get supporting single key, array of keys, or defaults object */
  async get(keysWithDefaults) {
    return new Promise((resolve) => {
      if (typeof keysWithDefaults === "string") {
        const val = this.getSync(keysWithDefaults);
        return resolve({ [keysWithDefaults]: val });
      }

      if (Array.isArray(keysWithDefaults)) {
        const result = {};
        keysWithDefaults.forEach((key) => {
          result[key] = this.getSync(key);
        });
        return resolve(result);
      }

      if (typeof keysWithDefaults === "object" && keysWithDefaults !== null) {
        const result = {};
        Object.entries(keysWithDefaults).forEach(([key, defaultVal]) => {
          const val = this.getSync(key);
          result[key] = val !== undefined ? val : defaultVal;
        });
        return resolve(result);
      }

      resolve({});
    });
  }

  /** Optimistic set with sub-millisecond in-memory write */
  async set(data) {
    if (!data || typeof data !== "object") return;

    // 1. Optimistic write to in-memory cache immediately
    Object.entries(data).forEach(([key, val]) => {
      this.memoryCache.set(key, val);
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.setItem(key, JSON.stringify(val));
        } catch (e) {}
      }
    });

    // 2. Persist asynchronously to chrome.storage.local
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set(data, () => resolve(true));
      } else {
        resolve(true);
      }
    });
  }

  /** Remove key(s) */
  async remove(keys) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach((k) => {
      this.memoryCache.delete(k);
      if (typeof localStorage !== "undefined") {
        try {
          localStorage.removeItem(k);
        } catch (e) {}
      }
    });

    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.remove(keys, () => resolve(true));
      } else {
        resolve(true);
      }
    });
  }

  /** Subscribe to storage change events */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}

export const storageAdapter = new StorageAdapter();