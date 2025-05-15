# Merchify

A powerful TypeScript SDK for integrating merchandise mockup generation and product catalog management into web applications.

![npm](https://img.shields.io/npm/v/merchify)
![License](https://img.shields.io/npm/l/merchify)

## Features

- 🖼️ **Dynamic Mockup Generation** - Create photo-realistic product mockups with your designs
- 🎨 **Rich Design Elements** - Support for both image and color design elements
- 📐 **Advanced Positioning** - Precise control over artwork alignment and placement
- 🔄 **Tiling & Scaling** - Pattern and design scaling capabilities
- 📦 **Product Catalog** - Access to product data, variants, and combinations

## Installation

```bash
npm install merchify
# or
yarn add merchify
# or
pnpm add merchify
```

## Quick Start

```typescript
import { createClient } from "merchify";

// Initialize the client
const merchifyClient = createClient({
  apiUrl: "https://api.merchify.example.com",
  mockupApiUrl: "https://mockup-api.merchify.example.com",
  accountId: "your-account-id",
});

// Generate a mockup
const mockup = await merchifyClient.mockups.getMockupUrl({
  design: [
    {
      type: "image",
      imageUrl: "https://example.com/my-artwork.png",
      placement: "front",
      width: 1200,
      height: 1600,
      alignment: "center",
      isTile: false,
    },
  ],
  product: {
    productId: "prod_123",
    mockupId: "mock_456",
    variantId: "var_789",
    width: 1400,
  },
});

console.log("Mockup URL:", mockup.url);
```

## Core Concepts

### Client Initialization

The SDK uses a singleton pattern to prevent multiple initializations:

```typescript
import { useMemo } from "react";
import { createClient, MerchifyClient } from "merchify";

// Hook for using the client in React applications
export function useMerchifyClient() {
  const client = useMemo(() => {
    return createClient({
      apiUrl: "YOUR_API_URL",
      mockupApiUrl: "YOUR_MOCKUP_API_URL",
      accountId: "YOUR_ACCOUNT_ID",
    });
  }, []);

  return client;
}
```

### Design Elements

The SDK supports two types of design elements:

#### Image Elements

```typescript
const imageElement: ImageDesignElement = {
  type: "image",
  imageUrl: "https://example.com/your-artwork.png",
  isTile: false,
  placement: "front",
  width: 1200,
  height: 1800,
  alignment: "center",
};
```

#### Color Elements

```typescript
const colorElement: ColorDesignElement = {
  type: "color",
  hex: "#FF5733",
  imageUrl: "",
  isTile: false,
  placement: "sleeve",
  width: 600,
  height: 300,
  alignment: "center",
};
```

### Image Alignment

Control the positioning of artwork within placements using the `ImageAlignment` type:

```typescript
// Available alignment options
type ImageAlignment =
  | "center"
  | "far-left"
  | "left"
  | "far-right"
  | "right"
  | "far-top"
  | "top"
  | "far-bottom"
  | "bottom";
```

### Mockup Generation

Generate mockups by providing design elements and product information:

```typescript
const result = await merchifyClient.mockups.getMockupUrl({
  design: [imageElement, colorElement],
  product: {
    productId: "tshirt_123",
    mockupId: "front_view",
    variantId: "blue_xl",
    width: 1400,
  },
});
```

### Product Data

The SDK provides types for working with product data:

```typescript
import { Product } from "merchify";

// Example of accessing product data
async function getProduct(id: string): Promise<Product> {
  const product = await fetchProductFromAPI(id);
  return product;
}
```

## API Reference

### Client Configuration

```typescript
interface ClientConfig {
  apiUrl: string;
  mockupApiUrl: string;
  accountId: string;
}
```

### MerchifyClient

The main client with various service modules:

- `mockups` - For mockup generation
- (Other services as implemented)

### Mockup API

#### getMockupUrl

```typescript
interface MockupOptions {
  design: DesignElement[];
  product: {
    productId: string;
    mockupId: string;
    variantId: string;
    width: number;
  };
}

interface MockupResult {
  url: string;
}

// Usage
const result = await merchifyClient.mockups.getMockupUrl(options);
```

### Types

#### DesignElement

Base interface for all design elements:

```typescript
interface DesignElement {
  type: "image" | "color";
  placement: string;
  width: number;
  height: number;
  alignment: ImageAlignment;
  isTile: boolean;
  imageUrl: string;
  tileScale?: string; // Only for image elements with isTile=true
  hex?: string; // Only for color elements
}
```

#### Product

Complex type containing all product information:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  options?: {
    attributes?: Record<string, Attribute>;
    attributesList?: string[];
    combinations?: Array<Record<string, string | number>>;
    selected?: Record<string, string>;
  };
  variants?: Array<{
    gvid: string;
    variant_id_for_mockups?: string;
    variant_placements: Placement[];
  }>;
  placements?: Placement[];
  mockups?: Array<{
    id: string;
    mockup_id: string;
    gvids: string[];
    width: number;
    height: number;
    variants: Array<{
      gvid: string;
      variant_id_for_mockups: string;
    }>;
    placements: Array<Placement>;
  }>;
  // Additional properties as needed
}
```

## Examples

### React Component for Mockup Display

```tsx
import { useState, useEffect } from "react";
import { DesignElement } from "merchify";
import { useMerchifyClient } from "../hooks/useMerchifyClient";

interface MockupProps {
  productId: string;
  mockupId: string;
  gvid: string;
  images: DesignElement[];
  width: number;
}

export function Mockup({
  productId,
  mockupId,
  gvid,
  images,
  width,
}: MockupProps) {
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const merchifyClient = useMerchifyClient();

  useEffect(() => {
    async function generateMockup() {
      if (!merchifyClient) return;

      try {
        setError(null);
        const result = await merchifyClient.mockups.getMockupUrl({
          design: images,
          product: {
            productId,
            mockupId,
            variantId: gvid,
            width,
          },
        });

        setMockupUrl(result.url);
      } catch (err) {
        console.error("Error generating mockup:", err);
        setError(
          err instanceof Error ? err.message : "Failed to generate mockup"
        );
      }
    }

    generateMockup();
  }, [merchifyClient, productId, mockupId, gvid, images, width]);

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!mockupUrl) {
    return <div>Generating mockup...</div>;
  }

  return <img src={mockupUrl} alt="Product mockup" className="mockup-image" />;
}
```

## License

MIT
