import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import axios from "axios";
import * as FormData from "form-data";

// Define interfaces for Cloudflare API responses
interface CloudflareResponse {
  success: boolean;
  result?: any;
  errors?: any[];
}

interface CloudflareUploadResult {
  id: string;
  uploadURL: string;
}

interface CloudflareImageResult {
  variants: string[];
}

@Injectable()
export class CloudflareService {
  private readonly accountId =
    process.env.CLOUDFLARE_ACCOUNT_ID || "3b6187e568b2744264ef17f8b143bc24";
  private readonly apiToken =
    process.env.CLOUDFLARE_API_TOKEN ||
    "OH1eoTdAPNqeTIx-rb1cBFFKiWvaSG7eQXzLNmEM";

  //   async generateDirectUploadUrl() {
  //     try {
  //       const response = await axios.post(
  //         `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v2/direct_upload`,
  //         {},
  //         {
  //           headers: {
  //             Authorization: `Bearer ${this.apiToken}`,
  //           },
  //         },
  //       );

  //       return response.data.result.uploadURL;
  //     } catch (error) {
  //       console.log(error.response?.data || error);
  //       throw new HttpException('Failed to generate upload URL', HttpStatus.BAD_REQUEST);
  //     }
  //   }
  // async generateDirectUploadUrl() {
  //   const form = new FormData();
  //   const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v2/direct_upload`;

  //   try {
  //     const response = await axios.post(
  //       url,
  //       // form,
  //       {},
  //       {
  //         headers: {
  //           // ...form.getHeaders(), // very important to set content-type with boundary
  //           Authorization: `Bearer ${this.apiToken}`,
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );

  //     const data = response.data;

  //     if (!data.success) {
  //       throw new Error(`Cloudflare error: ${JSON.stringify(data.errors)}`);
  //     }

  //     return data.result; // ensure this returns only the URL
  //   } catch (error) {
  //     console.error('[Cloudflare] Error:', JSON.stringify(error.response?.data ?? error, null, 2));
  //     throw new HttpException(
  //       error.response?.data ?? 'Failed to generate upload URL',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }
  async generateDirectUploadUrl(): Promise<CloudflareUploadResult> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v2/direct_upload`;

    const form = new FormData();
    form.append("requireSignedURLs", "true"); // optional, adjust as needed
    form.append("metadata", JSON.stringify({ generatedBy: "nestjs-service" })); // optional metadata

    try {
      const response = await axios.post<CloudflareResponse>(url, form, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          ...form.getHeaders(), // very important to set correct content-type including boundary
        },
      });

      const data = response.data;
      if (!data.success) {
        throw new Error(`Cloudflare error: ${JSON.stringify(data.errors)}`);
      }

      return data.result as CloudflareUploadResult; // returns { id, uploadURL }
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const errorData = (error as any)?.response?.data;

      console.error(
        "[Cloudflare] Error:",
        JSON.stringify(errorData ?? error, null, 2),
      );
      throw new HttpException(
        (errorData as string) ?? "Failed to generate upload URL",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async uploadImage(fileBuffer: Buffer, fileName: string): Promise<string> {
    const form = new FormData();
    form.append("file", fileBuffer, fileName);

    const response = await axios.post<CloudflareResponse>(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`,
      form,
      {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          ...form.getHeaders(),
        },
      },
    );

    const data = response.data;
    if (data.success) {
      const result = data.result as CloudflareImageResult;
      return result.variants[0]; // public URL
    } else {
      console.error("Cloudflare upload error:", JSON.stringify(data, null, 2));
      throw new Error(
        "Cloudflare image upload failed. Check logs for details.",
      );
    }
  }
}
