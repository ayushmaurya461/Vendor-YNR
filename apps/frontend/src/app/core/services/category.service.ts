import { Injectable } from '@angular/core';
import { Category } from '../models/vendor.model';
import { VendorApiService } from './vendor-api.service';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  constructor(private readonly vendorApi: VendorApiService) {}

  list(): Category[] {
    return this.vendorApi.categories;
  }
}
