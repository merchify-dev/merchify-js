import { beforeEach, describe, expect, it, vi } from "vitest";

import { createClient } from "../src";
import { MockupServiceImpl } from "../src/services/mockup";

// Mock the global fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock the API_URLS to use fixed values for testing
vi.mock("../src/config/constants", () => ({
  API_URLS: {
    production: {
      apiUrl: "https://api.example.com",
      mockupApiUrl: "https://mockup.example.com",
      urlSignerEndpoint: "https://signer.example.com/sign",
    },
    development: {
      apiUrl: "https://dev-api.example.com",
      mockupApiUrl: "https://dev-mockup.example.com",
      urlSignerEndpoint: "https://dev-signer.example.com/sign",
    },
  },
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 450,
    REQUESTS_PER_SECOND: 20,
  },
  CACHE_CONFIG: {
    STORAGE_CACHE_SIZE: 100,
    MEMORY_CACHE_SIZE: 500,
    SIGNATURE_CACHE_KEY: "test_cache_key",
  },
}));

describe("Merchify Web SDK Client", () => {
  beforeEach(() => {
    // Reset the fetch mock before each test
    mockFetch.mockReset();

    // Mock a successful response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        signature: "test-signature",
        urlWithSignature: "/mockup?productId=123&sig=test-signature",
      }),
    });
  });

  it("should create a client with required options", () => {
    const client = createClient({
      accountId: "test-account",
      clientId: "test-client",
    });

    expect(client).toBeDefined();
    expect(client.mockups).toBeDefined();
    expect(client.getConfig()).toEqual({
      accountId: "test-account",
      clientId: "test-client",
    });
  });

  it("should throw error if accountId is missing", () => {
    expect(() =>
      // @ts-expect-error Testing intentional misuse
      createClient({ clientId: "test-client" }),
    ).toThrow("accountId is required");
  });

  it("should throw error if clientId is missing", () => {
    expect(() =>
      // @ts-expect-error Testing intentional misuse
      createClient({ accountId: "test-account" }),
    ).toThrow("clientId is required");
  });

  it("should include accountId in the URL being signed", async () => {
    const client = createClient({
      accountId: "test-account-123",
      clientId: "test-client-456",
    });

    // Set up test input
    const input = {
      design: [
        {
          type: "color" as const,
          width: 800,
          height: 800,
          placement: "front",
          alignment: "center" as const,
          hex: "#FF0000",
          imageUrl: "https://example.com/image.jpg",
          isTile: false,
        },
      ],
      product: {
        productId: "product123",
        mockupId: "mockup456",
        variantId: "variant789",
      },
    };

    // Call the mockups service
    await client.mockups.getMockupUrl(input);

    // Verify the URL parameter includes the accountId
    expect(mockFetch).toHaveBeenCalled();
    const fetchUrl = mockFetch.mock.calls[0][0];

    // The URL parameter should contain an encoded URL that includes accountId
    const urlMatch = fetchUrl.match(/url=([^&]+)/);
    expect(urlMatch).toBeTruthy();

    // Decode the URL parameter to check its contents
    const encodedUrl = urlMatch ? urlMatch[1] : "";
    const decodedUrl = decodeURIComponent(encodedUrl);

    // The decoded URL should include the accountId
    expect(decodedUrl).toContain("accountId=test-account-123");

    // The URL parameter should NOT contain accountId as a separate parameter
    expect(fetchUrl).not.toContain("&accountId=");

    // But it should still include clientId
    expect(fetchUrl).toContain("clientId=test-client-456");
  });
});
