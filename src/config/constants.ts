export const API_URLS = {
  production: {
    apiUrl: "https://api.merchify.io",
    mockupApiUrl: "https://api.merchify.io/v1/mockups/",
    urlSignerEndpoint: "https://api.merchify.io/v1/url-signer/sign",
  },
  development: {
    apiUrl: "http://localhost:8080",
    mockupApiUrl: "http://localhost:8089",
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
