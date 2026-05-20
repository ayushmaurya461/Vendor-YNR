import { Injectable, inject, signal } from '@angular/core';
import type { Vendor } from '../models/vendor.model';
import { VendorApiService } from './vendor-api.service';

@Injectable({ providedIn: 'root' })
export class SavedVendorsService {
  private readonly vendorApi = inject(VendorApiService);

  private readonly savedIdsState = signal<Set<string>>(new Set());
  private readonly savedVendorsState = signal<Vendor[]>([]);
  private readonly loadingState = signal(false);
  private readonly togglingState = signal<string | null>(null);

  readonly savedIds = this.savedIdsState.asReadonly();
  readonly savedVendors = this.savedVendorsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly togglingId = this.togglingState.asReadonly();

  savedCount(): number {
    return this.savedIdsState().size;
  }

  clear(): void {
    this.savedIdsState.set(new Set());
    this.savedVendorsState.set([]);
    this.loadingState.set(false);
    this.togglingState.set(null);
  }

  isSaved(vendorId: string): boolean {
    return this.savedIdsState().has(vendorId);
  }

  async refresh(): Promise<void> {
    this.loadingState.set(true);
    try {
      const { ids, items } = await this.vendorApi.fetchSavedVendors();
      this.savedIdsState.set(new Set(ids));
      this.savedVendorsState.set(items);
    } catch {
      this.savedIdsState.set(new Set());
      this.savedVendorsState.set([]);
    } finally {
      this.loadingState.set(false);
    }
  }

  async toggle(vendorId: string): Promise<void> {
    if (this.togglingState() === vendorId) {
      return;
    }
    this.togglingState.set(vendorId);
    try {
      if (this.isSaved(vendorId)) {
        await this.vendorApi.unsaveVendor(vendorId);
        this.savedIdsState.update((ids) => {
          const next = new Set(ids);
          next.delete(vendorId);
          return next;
        });
        this.savedVendorsState.update((rows) => rows.filter((row) => row.id !== vendorId));
      } else {
        await this.vendorApi.saveVendor(vendorId);
        this.savedIdsState.update((ids) => new Set(ids).add(vendorId));
        const v = await this.vendorApi.fetchVendorById(vendorId);
        if (v) {
          this.savedVendorsState.update((rows) =>
            rows.some((row) => row.id === vendorId) ? rows : [v, ...rows],
          );
        }
      }
    } finally {
      this.togglingState.set(null);
    }
  }
}
