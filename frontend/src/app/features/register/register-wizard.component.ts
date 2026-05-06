import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { Vendor } from '../../core/models/vendor.model';
import { VendorApiService } from '../../core/services/vendor-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ReviewStepComponent } from './steps/review-step.component';
import { VendorInfoStepComponent } from './steps/vendor-info-step.component';

@Component({
  selector: 'app-register-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, VendorInfoStepComponent, ReviewStepComponent],
  template: `
    <section class="view">
      <header class="page-head">
        <h1>Register your listing</h1>
        <a class="btn btn--secondary" routerLink="/dashboard">← Back</a>
      </header>

      <div class="steps">
        <span class="step step--done">✓ Phone</span>
        <span class="step" [class.step--active]="step() === 2">2 Your info</span>
        <span class="step" [class.step--active]="step() === 3">3 Review</span>
      </div>

      @if (step() === 2) {
        <app-vendor-info-step [form]="vendorForm" (next)="moveToReview()" />
      } @else {
        <app-review-step [form]="vendorForm" (back)="step.set(2)" (saveDraft)="save('draft')" (goLive)="save('live')" />
      }
      @if (saveError()) {
        <p class="muted">{{ saveError() }}</p>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterWizardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly vendorApi = inject(VendorApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly step = signal(2);
  readonly saveError = signal('');

  readonly vendorForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    category: ['electrician', [Validators.required]],
    area: ['', [Validators.required]],
    about: [''],
    phone: ['', [Validators.required]],
    whatsapp: [''],
  });

  ngOnInit(): void {
    const phoneDefault = this.auth.user()?.phone ?? '';
    this.vendorForm.patchValue({
      phone: phoneDefault,
      whatsapp: phoneDefault,
    });
    void this.vendorApi.fetchMyListingSilently().then((listing) => {
      if (!listing) {
        return;
      }
      const areaBare = listing.area.replace(/,\s*YNR\s*$/i, '').trim();
      this.vendorForm.patchValue({
        name: listing.name,
        category: listing.category as Vendor['category'],
        area: areaBare,
        about: listing.about ?? '',
        phone: listing.phone,
        whatsapp: listing.whatsapp,
      });
    });
  }

  moveToReview(): void {
    if (this.vendorForm.invalid) {
      this.vendorForm.markAllAsTouched();
      return;
    }
    this.step.set(3);
  }

  save(status: 'draft' | 'live'): void {
    if (this.vendorForm.invalid) {
      this.vendorForm.markAllAsTouched();
      return;
    }
    this.saveError.set('');
    const value = this.vendorForm.getRawValue();
    const areaFull = `${value.area.trim()}, YNR`;
    const whatsappDigits = (value.whatsapp?.trim().length ? value.whatsapp : value.phone).trim();

    void (async (): Promise<void> => {
      try {
        let existing = this.vendorApi.myVendor();
        if (!existing) {
          existing = await this.vendorApi.fetchMyListingSilently();
        }

        if (existing) {
          await this.vendorApi.patchVendorListing(existing.id, {
            name: value.name.trim(),
            category: value.category as Vendor['category'],
            area: areaFull,
            phone: value.phone.trim(),
            whatsapp: whatsappDigits,
            about: value.about.trim() ? value.about.trim() : undefined,
            services: ['Wiring', 'Switchboard'],
          });
          await this.vendorApi.updateVendorStatus(existing.id, status);
        } else {
          await this.vendorApi.createVendor({
            name: value.name.trim(),
            category: value.category as Vendor['category'],
            area: areaFull,
            phone: value.phone.trim(),
            whatsapp: whatsappDigits,
            about: value.about.trim() ? value.about.trim() : undefined,
            services: ['Wiring', 'Switchboard'],
            status,
          });
        }
        await this.vendorApi.refreshMyDashboard().catch(() => undefined);
        await this.router.navigateByUrl('/dashboard');
      } catch {
        this.saveError.set(
          'Saving failed (check listing fields, uniqueness, or that you are logged in as a vendor).',
        );
      }
    })();
  }
}
