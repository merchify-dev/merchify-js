export const API_URLS = {
  production: {
    apiUrl: "https://api.merchify.io",
    mockupApiUrl: "https://i.merchify.io",
    urlSignerEndpoint: "https://s.merchify.io/sign",
  },
  development: {
    apiUrl: "http://localhost:8080",
    // mockupApiUrl: "http://162.255.23.80:8089",
    mockupApiUrl: "https://i.merchify.io",
    urlSignerEndpoint: "http://localhost:8102/sign",
  },
};

export const RATE_LIMITS = {
  REQUESTS_PER_MINUTE: 450,
  REQUESTS_PER_SECOND: 20,
};

export const CACHE_CONFIG = {
  STORAGE_CACHE_SIZE: 100, // localStorage cache size
  MEMORY_CACHE_SIZE: 500, // in-memory cache size
  SIGNATURE_CACHE_KEY: "merchify_signature_cache",
};
