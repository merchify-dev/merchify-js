import { SignatureCache } from "../cache/SignatureCache";
import { API_URLS, RATE_LIMITS } from "../config/constants";
import type {
  DesignElement,
  GetMockupUrlInput,
  GetMockupUrlOutput,
  MockupService,
  RateLimitInfo,
} from "../types/index";

export class MockupServiceImpl implements MockupService {
  private urls: typeof API_URLS.production | typeof API_URLS.development;
  private accountId: string;
  private clientId: string;
  private signatureCache: SignatureCache;
  private rateInfo = {
    perMinute: 0,
    perSecond: 0,
    limits: RATE_LIMITS,
  };
  private queueLength = 0;

  constructor(
    accountId: string,
    clientId: string,
    isDevelopment: boolean = process.env.NODE_ENV === "development",
  ) {
    this.accountId = accountId;
    this.clientId = clientId;
    this.urls = isDevelopment ? API_URLS.development : API_URLS.production;
    this.signatureCache = new SignatureCache();
  }

  /**
   * Normalize a URL to ensure it starts with "/"
   */
  private normalizeRelativeUrl(url: string): string {
    if (url.startsWith("http")) {
      throw new Error(
        'URL must be relative. Please provide a URL that starts with "/" instead of a full URL.',
      );
    }
    return url.startsWith("/") ? url : "/" + url;
  }

  /**
   * Convert a relative URL to an absolute URL using the mockup API base
   */
  private toAbsoluteUrl(relativeUrl: string): string {
    return relativeUrl.startsWith("/")
      ? `${this.urls.mockupApiUrl}${relativeUrl}`
      : `${this.urls.mockupApiUrl}/${relativeUrl}`;
  }

  /**
   * Add signature to a URL
   */
  private addSignatureToUrl(url: string, signature: string): string {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}sig=${encodeURIComponent(signature)}`;
  }

  /**
   * Add accountId to a URL
   */
  private addAccountIdToUrl(url: string): string {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}accountId=${encodeURIComponent(this.accountId)}`;
  }

  /**
   * Get signed URL from external service
   */
  private async getSignedUrl(url: string): Promise<string> {
    try {
      const relativeUrl = this.normalizeRelativeUrl(url);

      // Add accountId to the URL being signed
      const urlWithAccountId = this.addAccountIdToUrl(relativeUrl);

      // Check cache first using URL with accountId as key
      const cachedSignature = this.signatureCache.get(urlWithAccountId);
      if (cachedSignature) {
        console.log("Cache hit for URL signature");
        // For cached signatures, we build the full URL
        const signedRelativeUrl = this.addSignatureToUrl(
          urlWithAccountId,
          cachedSignature,
        );
        return this.toAbsoluteUrl(signedRelativeUrl);
      }

      // Request new signature
      const signerEndpoint = `${this.urls.urlSignerEndpoint}?url=${encodeURIComponent(urlWithAccountId)}&clientId=${encodeURIComponent(this.clientId)}`;
      const response = await fetch(signerEndpoint, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Client-ID": this.clientId,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new Error(
          `URL signing failed: ${response.status} ${response.statusText} ${errorText}`,
        );
      }

      const data = await response.json();
      if (!data?.signature || !data?.urlWithSignature) {
        throw new Error(
          "Invalid response from signer service - missing signature or urlWithSignature",
        );
      }

      // Cache the signature for future use - use the URL with accountId as the key
      this.signatureCache.set(urlWithAccountId, data.signature);

      // The urlWithSignature from the server is relative, convert it to absolute
      return this.toAbsoluteUrl(data.urlWithSignature);
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unknown error while getting signed URL");
    }
  }

  /**
   * Track a new request for rate limiting
   */
  private trackRateLimit(): void {
    this.queueLength++;
    this.rateInfo.perMinute++;
    this.rateInfo.perSecond++;

    // Reset per-second counter after 1 second
    setTimeout(() => {
      this.rateInfo.perSecond = Math.max(0, this.rateInfo.perSecond - 1);
    }, 1000);

    // Reset per-minute counter after 1 minute
    setTimeout(() => {
      this.rateInfo.perMinute = Math.max(0, this.rateInfo.perMinute - 1);
    }, 60 * 1000);
  }

  /**
   * Decrease queue length (used when request fails)
   */
  private decreaseQueueLength(): void {
    this.queueLength = Math.max(0, this.queueLength - 1);
  }

  /**
   * Validate mockup URL input parameters
   */
  private validateMockupInput(input: GetMockupUrlInput): void {
    if (!input.design || input.design.length === 0 || !input.product) {
      throw new Error(
        "Invalid input: at least one design image and product details are required",
      );
    }

    if (
      !input.design.every(
        (img: DesignElement) =>
          (img.type === "image" && img.imageUrl) ||
          (img.type === "color" && img.hex),
      )
    ) {
      throw new Error(
        "Each design image must have either an imageUrl or hex color",
      );
    }

    if (!input.product.productId || !input.product.mockupId) {
      throw new Error("Product ID and mockup ID are required");
    }
  }

  /**
   * Build the mockup URL from input parameters
   */
  private buildMockupUrl(input: GetMockupUrlInput): string {
    const designBase64 = btoa(JSON.stringify(input.design));
    const encodedDesign = encodeURIComponent(designBase64);

    let mockupUrl = `/mockup?productId=${encodeURIComponent(input.product.productId)}&mockupId=${encodeURIComponent(input.product.mockupId)}&variantId=${encodeURIComponent(input.product.variantId || "VtPGZi")}&design=${encodedDesign}`;

    if (input.product.width) {
      mockupUrl += `&width=${input.product.width}`;
    }

    return mockupUrl;
  }

  async getMockupUrl(input: GetMockupUrlInput): Promise<GetMockupUrlOutput> {
    console.log("Getting mockup URL with input:", input);

    try {
      // Validate input
      this.validateMockupInput(input);

      // Track rate limiting
      this.trackRateLimit();

      // Build and sign URL
      const mockupUrl = this.buildMockupUrl(input);
      const signedUrl = await this.getSignedUrl(mockupUrl);

      console.log("returning url:", signedUrl);

      return { url: signedUrl };
    } catch (error) {
      this.decreaseQueueLength();
      console.error("Error generating mockup URL:", error);
      throw error;
    }
  }

  getRateLimitInfo(): RateLimitInfo {
    return {
      queueLength: this.queueLength,
      rateInfo: this.rateInfo,
    };
  }
}
