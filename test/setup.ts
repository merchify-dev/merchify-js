import { vi } from "vitest";

// Mock environment variables
vi.stubEnv("NODE_ENV", "test");

// Mock window.btoa for NodeJS environment
globalThis.btoa = (str: string) => Buffer.from(str).toString("base64");

// We need to mock TextEncoder for Node environment
if (typeof TextEncoder === "undefined") {
  global.TextEncoder = class TextEncoder {
    encode(string: string): Uint8Array {
      const buffer = Buffer.from(string);
      return new Uint8Array(buffer);
    }
  } as any;
}

// Add any other global test setup here
