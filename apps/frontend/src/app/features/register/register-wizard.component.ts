import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import type { Vendor } from '../../core/models/vendor.model';
import { VendorApiService } from '../../core/services/vendor-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ReviewStepComponent } from './steps/review-step.component';
import { VendorInfoStepComponent } from './steps/vendor-info-step.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-register-wizard',
  standalone: true,
  styleUrl: './register-wizard.component.css',
  imports: [ReactiveFormsModule, VendorInfoStepComponent, ReviewStepComponent, PageHeaderComponent],
  template: `
    <section class="view">
      <app-page-header [title]="pageTitle()" />

      <div class="steps">
        <span class="step step--done">✓ Phone</span>
        <span class="step" [class.step--active]="step() === 2">2 Your info</span>
        <span class="step" [class.step--active]="step() === 3">3 Review</span>
      </div>

      @if (step() === 2) {
        <app-vendor-info-step
          [form]="vendorForm"
          (next)="moveToReview()"
          (cancel)="cancel()"
        />
      } @else {
        <app-review-step
          [form]="vendorForm"
          (back)="step.set(2)"
          (cancel)="cancel()"
          (saveDraft)="save('draft')"
          (goLive)="save('live')"
        />
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
  private readonly route = inject(ActivatedRoute);
  readonly step = signal(2);
  readonly saveError = signal('');

  readonly pageTitle = computed(() => {
    if (this.route.snapshot.queryParamMap.get('new') === '1') {
      return 'Add another listing';
    }
    if (this.route.snapshot.queryParamMap.get('listingId')) {
      return 'Edit your listing';
    }
    return 'Register your listing';
  });

  readonly vendorForm = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    category: ['electrician', [Validators.required]],
    area: ['', [Validators.required]],
    about: [''],
    phone: ['', [Validators.required]],
    whatsapp: [''],
    photoUrl: [''],
  });

  ngOnInit(): void {
    const phoneDefault = this.auth.user()?.phone ?? '';
    this.vendorForm.patchValue({
      phone: phoneDefault,
      whatsapp: phoneDefault,
    });
    const isNew = this.route.snapshot.queryParamMap.get('new') === '1';
    const listingId = this.route.snapshot.queryParamMap.get('listingId');

    void this.vendorApi.fetchMyListingsSilently().then((listings) => {
      if (isNew) {
        return;
      }
      const listing = listingId
        ? listings.find((row) => row.id === listingId)
        : listings[0];
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
        photoUrl: listing.photoUrl ?? '',
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

  cancel(): void {
    const destination = this.vendorApi.hasVendorListing() ? '/dashboard' : '/';
    void this.router.navigateByUrl(destination);
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
        const isNew = this.route.snapshot.queryParamMap.get('new') === '1';
        const listingId = this.route.snapshot.queryParamMap.get('listingId');
        const listings = await this.vendorApi.fetchMyListingsSilently();
        const editTarget = listingId
          ? listings.find((row) => row.id === listingId)
          : isNew
            ? undefined
            : listings[0];

        const photoUrl = value.photoUrl.trim();

        if (editTarget) {
          await this.vendorApi.patchVendorListing(editTarget.id, {
            name: value.name.trim(),
            category: value.category as Vendor['category'],
            area: areaFull,
            phone: value.phone.trim(),
            whatsapp: whatsappDigits,
            about: value.about.trim() ? value.about.trim() : undefined,
            services: [
              {
                name: 'Wiring',
                description: 'Home and shop wiring, fault finding, and new connections.',
              },
              {
                name: 'Switchboard',
                description: 'Switchboard repair, upgrades, and safety checks.',
              },
            ],
            photoUrl,
          });
          await this.vendorApi.updateVendorStatus(editTarget.id, status);
        } else {
          await this.vendorApi.createVendor({
            name: value.name.trim(),
            category: value.category as Vendor['category'],
            area: areaFull,
            phone: value.phone.trim(),
            whatsapp: whatsappDigits,
            about: value.about.trim() ? value.about.trim() : undefined,
            services: [
              {
                name: 'Wiring',
                description: 'Home and shop wiring, fault finding, and new connections.',
              },
              {
                name: 'Switchboard',
                description: 'Switchboard repair, upgrades, and safety checks.',
              },
            ],
            photoUrl: photoUrl || undefined,
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
