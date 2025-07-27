import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import axios from "axios";
import * as FormData from "form-data";
import * as fs from "fs";

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
  async generateDirectUploadUrl(): Promise<{ id: string; uploadURL: string }> {
    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v2/direct_upload`;

    const form = new FormData();
    form.append("requireSignedURLs", "true"); // optional, adjust as needed
    form.append("metadata", JSON.stringify({ generatedBy: "nestjs-service" })); // optional metadata

    try {
      const response = await axios.post(url, form, {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          ...form.getHeaders(), // very important to set correct content-type including boundary
        },
      });

      if (!response.data.success) {
        throw new Error(
          `Cloudflare error: ${JSON.stringify(response.data.errors)}`
        );
      }

      return response.data.result; // returns { id, uploadURL }
    } catch (error) {
      console.error(
        "[Cloudflare] Error:",
        JSON.stringify(error.response?.data ?? error, null, 2)
      );
      throw new HttpException(
        error.response?.data ?? "Failed to generate upload URL",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  async uploadImage(fileBuffer: Buffer, fileName: string) {
    const form = new FormData();
    form.append("file", fileBuffer, fileName);

    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`,
      form,
      {
        headers: {
          Authorization: `Bearer ${this.apiToken}`,
          ...form.getHeaders(),
        },
      }
    );

    if (response.data.success) {
      return response.data.result.variants[0]; // public URL
    } else {
      console.error(
        "Cloudflare upload error:",
        JSON.stringify(response.data, null, 2)
      );
      throw new Error(
        "Cloudflare image upload failed. Check logs for details."
      );
    }
  }
}
