import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export type PhotoUploadScope = 'profile' | 'vendor';

interface CloudinarySignPayload {
  provider: 'cloudinary';
  signature: string;
  timestamp: number;
  cloudName: string;
  apiKey: string;
  folder: string;
}

interface LocalSignPayload {
  provider: 'local';
}

type UploadSignPayload = CloudinarySignPayload | LocalSignPayload;

interface UploadUrlPayload {
  url: string;
}

interface CloudinaryUploadResponse {
  secure_url: string;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

  uploadPhoto(file: File, scope: PhotoUploadScope): Promise<string> {
    return scope === 'profile' ? this.uploadProfilePhoto(file) : this.uploadVendorPhoto(file);
  }

  async uploadProfilePhoto(file: File): Promise<string> {
    return this.upload(file, 'profile');
  }

  async uploadVendorPhoto(file: File): Promise<string> {
    return this.upload(file, 'vendor');
  }

  private async upload(file: File, scope: PhotoUploadScope): Promise<string> {
    this.validateImage(file);
    const sign = await this.getUploadSignature(scope);
    if (this.useLocalUpload(sign)) {
      return this.uploadViaApi(file, scope);
    }
    return this.uploadToCloudinary(file, sign as CloudinarySignPayload);
  }

  /** In dev, always upload via API disk storage (never hit Cloudinary directly). */
  private useLocalUpload(sign: UploadSignPayload): boolean {
    if (sign.provider === 'local') {
      return true;
    }
    return !environment.production;
  }

  private async uploadViaApi(file: File, scope: PhotoUploadScope): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await firstValueFrom(
      this.http.post<{ success: boolean; data: UploadUrlPayload }>(
        `${environment.apiUrl}/media/upload`,
        formData,
        { params: { scope } },
      ),
    );
    if (!res.data.url) {
      throw new Error('Photo upload failed. Try again.');
    }
    return res.data.url;
  }

  private async uploadToCloudinary(file: File, sign: CloudinarySignPayload): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', sign.apiKey);
    formData.append('timestamp', String(sign.timestamp));
    formData.append('signature', sign.signature);
    formData.append('folder', sign.folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`;
    const response = await fetch(uploadUrl, { method: 'POST', body: formData });
    if (!response.ok) {
      throw new Error(await this.readUploadError(response));
    }

    const body = (await response.json()) as CloudinaryUploadResponse;
    if (!body.secure_url) {
      throw new Error('Photo upload failed. Try again.');
    }
    return body.secure_url;
  }

  private async getUploadSignature(scope: PhotoUploadScope): Promise<UploadSignPayload> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ success: boolean; data: UploadSignPayload }>(
          `${environment.apiUrl}/media/sign`,
          { params: { scope } },
        ),
      );
      const data = res.data;
      if (!data || typeof data !== 'object') {
        throw new Error('Photo upload failed. Invalid server response.');
      }
      if (!('provider' in data)) {
        throw new Error(
          'Photo upload is misconfigured on the server. Restart the API (npm run dev in apps/api).',
        );
      }
      return data;
    } catch (err: unknown) {
      const message = this.extractHttpErrorMessage(err);
      throw new Error(message ?? 'Photo upload failed. Check that the API is running.');
    }
  }

  private extractHttpErrorMessage(err: unknown): string | null {
    if (typeof err !== 'object' || err === null || !('error' in err)) {
      return null;
    }
    const httpErr = err as { error?: unknown; message?: string };
    if (typeof httpErr.error === 'string') {
      try {
        const parsed = JSON.parse(httpErr.error) as { message?: string };
        return parsed.message ?? null;
      } catch {
        return httpErr.error;
      }
    }
    if (typeof httpErr.message === 'string') {
      return httpErr.message;
    }
    return null;
  }

  private async readUploadError(response: Response): Promise<string> {
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      const msg = body.error?.message ?? '';
      if (msg.includes('cloud_name is disabled')) {
        return 'Your Cloudinary account is disabled. In development, remove MEDIA_UPLOAD=cloudinary from apps/api/.env and restart the API to use local uploads.';
      }
      if (msg.includes('Unknown API key') || msg.includes('Invalid API key')) {
        return 'Photo upload is not set up on the server yet (Cloudinary API key). Configure apps/api/.env or use development mode for local uploads.';
      }
      if (msg) {
        return `Photo upload failed: ${msg}`;
      }
    } catch {
      /* ignore parse errors */
    }
    if (response.status === 503) {
      return 'Photo upload is not available right now. Try again later.';
    }
    return 'Photo upload failed. Try again.';
  }

  private validateImage(file: File): void {
    if (!ALLOWED_TYPES.has(file.type)) {
      throw new Error('Use a JPG, PNG, or WebP image.');
    }
    if (file.size > MAX_PHOTO_BYTES) {
      throw new Error('Photo must be under 5 MB.');
    }
  }
}
