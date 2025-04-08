/**
 * Merchify Web SDK
 * A simple browser-based SDK for Merchify services
 */

import { MockupServiceImpl } from "./services/mockup";
import type { ClientOptions, MerchifyClient } from "./types/index";

// Re-export all types
export * from "./types/index";

export function createClient(options: ClientOptions): MerchifyClient {
  // Only log in development and non-production environments
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Merchify Web SDK Client dude");
  }

  // Validate required fields
  if (!options.accountId) {
    console.error("accountId is required");
    throw new Error("accountId is required");
  }
  if (!options.clientId) {
    console.error("clientId is required");
    throw new Error("clientId is required");
  }

  console.log("Creating Merchify Web SDK Client with options:", options);

  // Create mockup service instance
  const mockupService = new MockupServiceImpl(
    options.accountId,
    options.clientId,
  );

  console.log("Mockup service created:", mockupService);

  // Return the client object
  return {
    mockups: mockupService,
    getConfig: () => ({ ...options }),
  };
}
