export type ImageAlignment =
  | "center"
  | "top"
  | "far-top"
  | "bottom"
  | "far-bottom"
  | "left"
  | "far-left"
  | "right"
  | "far-right";

export interface Placement {
  id: string;
  label: string;
  name: string;
  width: number;
  height: number;
  publicLabel: string;
  type: "color" | "image";
}

// Base interface for common properties
export interface BaseDesignElement {
  type: "color" | "image";
  width: number;
  height: number;
  placement: string;
  alignment: ImageAlignment;
}

// Color design element type
export interface ColorDesignElement extends BaseDesignElement {
  type: "color";
  hex: string;
  imageUrl: string;
  isTile: boolean;
  tileScale?: never;
}

// Regular image design element type
export interface ImageDesignElement extends BaseDesignElement {
  type: "image";
  imageUrl: string;
  isTile: boolean;
  tileScale?: string;
  hex?: never;
}

// Union type for all possible design element types
export type DesignElement = ColorDesignElement | ImageDesignElement;

export interface Mockup {
  id: string;
  mockup_id: string;
  global_variant_ids: string[];
  gvids: string[];
  width: number;
  height: number;
  variants: Array<{
    global_variant_id: string;
    gvid: string;
    variant_id_for_mockups: string;
  }>;
  placements: Array<Placement>;
}

export interface Attribute {
  type: string;
  affectsCombinations?: boolean;
  choices: Array<{
    label: string;
    hex?: string;
  }>;
}

export interface ProductVariant {
  global_variant_id: string;
  variant_id_for_mockups: string;
  variant_placements: Array<Placement>;
}

export interface ProductOptions {
  attributesList: string[];
  attributes: {
    [key: string]: Attribute;
  };
  combinations: Array<{
    [key: string]: string | number;
    variantId: string;
    variantIdForMockups: string;
    price: number;
  }>;
  selected?: Record<string, string>;
}

export interface ProductFromMerchify {
  id: string;
  name: string;
  variants: ProductVariant[];
  mockups: Array<Mockup>;
  placements: Array<Placement>;
  options?: ProductOptions;
  price: number;
  photos?: Array<{
    id: string;
    title: string;
    raws: {
      guid: string;
      file_extension: string;
    };
  }>;
}

export interface SelectedCombination {
  variantId?: string;
  variantIdForMockups?: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  options?: ProductOptions;
  placements?: Array<Placement>;
  variants?: Array<ProductVariant>;
  mockups?: Array<Mockup>;
  price: number;
  json: any; // This should be typed properly based on the actual data structure
}

export interface ClientOptions {
  accountId: string; // Account ID for URL signing
  clientId: string; // Client ID for authentication
  apiUrl?: string;
  urlSignerEndpoint?: string;
  mockupApiUrl?: string;
}

export interface GetMockupUrlInput {
  design: DesignElement[];
  product: {
    productId: string;
    mockupId: string;
    variantId: string;
    width?: number;
  };
}

export interface GetMockupUrlOutput {
  url: string;
}

export interface RateLimitInfo {
  queueLength: number;
  rateInfo: {
    perMinute: number;
    perSecond: number;
    limits: {
      REQUESTS_PER_MINUTE: number;
      REQUESTS_PER_SECOND: number;
    };
  };
}

export interface MockupService {
  getMockupUrl(params: GetMockupUrlInput): Promise<GetMockupUrlOutput>;
  getRateLimitInfo(): RateLimitInfo;
}

export interface MerchifyClient {
  mockups: MockupService;
  getConfig(): ClientOptions;
}
