import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import type { Vendor, VendorReview } from '../../core/models/vendor.model';
import { VendorApiService } from '../../core/services/vendor-api.service';
import { AuthService } from '../../core/services/auth.service';
import { SavedVendorsService } from '../../core/services/saved-vendors.service';
import { AvatarComponent } from '../../shared/ui/avatar.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { getWhatsappUrl } from '../../shared/utils/whatsapp-url.util';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { IconComponent } from '../../shared/ui/icon.component';
import { SubmitReviewModalComponent } from '../../shared/ui/submit-review-modal.component';
import { AllReviewsModalComponent } from '../../shared/ui/all-reviews-modal.component';
import { ratingStars } from '../../shared/utils/rating-stars.util';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

const REVIEW_PREVIEW_LIMIT = 3;

@Component({
  selector: 'app-vendor-detail',
  standalone: true,
  styleUrls: ['./vendor-detail.component.css', '../../shared/ui/review-list.css'],
  imports: [
    RouterLink,
    DatePipe,
    AvatarComponent,
    BadgeComponent,
    PageHeaderComponent,
    IconComponent,
    SubmitReviewModalComponent,
    AllReviewsModalComponent,
    EmptyStateComponent,
  ],
  template: `
    <section class="view">
      <app-page-header [title]="pageTitle()" />

      @if (loading()) {
        <div class="state-panel state-panel--loading" aria-busy="true">
          <p class="state-panel__title">Loading vendor…</p>
          <p class="muted">Fetching listing details.</p>
        </div>
      } @else if (vendor(); as data) {
        <article class="card vendor-hero">
          <app-avatar [name]="data.name" [photoUrl]="data.photoUrl" />
          <div class="vendor-hero__body">
            <div class="vendor-hero__title-row">
              <h2>{{ data.name }}</h2>
              @if (canBookmark()) {
                <button
                  type="button"
                  class="bookmark-btn"
                  [class.bookmark-btn--saved]="isBookmarked()"
                  [disabled]="bookmarkBusy()"
                  [attr.aria-label]="isBookmarked() ? 'Remove from saved' : 'Save vendor'"
                  [attr.aria-pressed]="isBookmarked()"
                  (click)="toggleBookmark()"
                >
                  <app-icon name="bookmark" [size]="22" [filled]="isBookmarked()" />
                </button>
              }
            </div>
            <p>{{ prettyCategory(data.category) }}</p>
            <div class="vendor-meta">
              <app-badge [tone]="data.status === 'live' ? 'success' : 'danger'">
                {{ data.status === 'live' ? '● Available' : '● Currently unavailable' }}
              </app-badge>
              <span class="meta-line muted">
                <app-icon name="location" [size]="16" />
                <span>{{ data.area }}</span>
              </span>
            </div>
          </div>
        </article>

        @if (data.status === 'live') {
          <div class="detail-ctas">
            <a class="btn btn--secondary" [href]="'tel:+91' + data.phone">
              <app-icon name="phone" [size]="18" />
              <span>Call now</span>
            </a>
            <a
              class="btn btn--secondary"
              [href]="whatsApp(data.whatsapp)"
              target="_blank"
              rel="noopener"
            >
              <app-icon name="whatsapp" [size]="20" />
              <span>WhatsApp</span>
            </a>
          </div>
        }

        <article class="card">
          <p class="section-title">About</p>
          <p>{{ data.about || 'No additional details yet.' }}</p>
        </article>

        <article class="card services-card">
          <p class="section-title services-card__title">Services offered</p>
          <ul class="service-list">
            @for (service of data.services ?? []; track service.name) {
              <li class="service-item">
                @if (service.imageUrl) {
                  <img class="service-item__image" [src]="service.imageUrl" [alt]="service.name" />
                } @else {
                  <div class="service-item__placeholder" aria-hidden="true">{{ serviceInitial(service.name) }}</div>
                }
                <div class="service-item__body">
                  <h3 class="service-item__name">{{ service.name }}</h3>
                  <p
                    class="service-item__desc"
                    [class.service-item__desc--empty]="!service.description?.trim()"
                  >
                    {{ service.description?.trim() || 'No description available.' }}
                  </p>
                </div>
              </li>
            } @empty {
              <p class="services-card__empty muted">No services listed yet.</p>
            }
          </ul>
        </article>

        <article class="card reviews-card">
          <div class="reviews-card__head">
            <p class="section-title reviews-card__title">Reviews</p>
            @if (canSubmitReview()) {
              <button
                type="button"
                class="btn btn--primary reviews-card__cta"
                (click)="openReviewModal()"
              >
                Submit a review
              </button>
            }
          </div>

          @if (reviewsLoading()) {
            <p class="muted">Loading reviews…</p>
          } @else {
            @if (reviews().length === 0) {
              <p class="muted">No reviews yet.</p>
            } @else {
              <ul class="review-list">
                @for (review of previewReviews(); track review.id) {
                  <li class="review-item">
                    <div class="review-item__head">
                      <strong>{{ review.authorName }}</strong>
                      <span class="review-item__rating" [attr.aria-label]="review.rating + ' out of 5 stars'">
                        {{ stars(review.rating) }}
                      </span>
                    </div>
                    <p class="review-item__comment">{{ review.comment }}</p>
                    <p class="review-item__date muted">{{ review.createdAt | date: 'd MMM y' }}</p>
                  </li>
                }
              </ul>
              <button
                type="button"
                class="btn btn--secondary reviews-card__all"
                (click)="openAllReviewsModal()"
              >
                Show all reviews ({{ reviews().length }})
              </button>
            }
          }
        </article>

        <article class="card">
          <p class="section-title">Area</p>
          <p class="meta-line">
            <app-icon name="location" [size]="18" />
            <span>{{ data.area }}</span>
          </p>
        </article>

        <article class="card">
          <p class="section-title">Phone</p>
          <a class="meta-line" [href]="'tel:+91' + data.phone">
            <app-icon name="phone" [size]="18" />
            <span>+91 {{ data.phone }}</span>
          </a>
        </article>

        <article class="card">
          <p class="section-title">WhatsApp</p>
          <a class="meta-line" [href]="whatsApp(data.whatsapp)" target="_blank" rel="noopener">
            <app-icon name="whatsapp" [size]="20" />
            <span>+91 {{ data.whatsapp }}</span>
          </a>
        </article>
      } @else {
        <app-empty-state
          icon="error"
          title="Vendor not found"
          description="This listing is unavailable or the link may be incorrect."
        >
          <a class="btn btn--primary" routerLink="/vendors">Find vendors</a>
        </app-empty-state>
      }

      @if (vendor(); as data) {
        <app-submit-review-modal
          [open]="showReviewForm()"
          [vendorName]="data.name"
          [vendorCategory]="prettyCategory(data.category)"
          [vendorArea]="data.area"
          [vendorPhotoUrl]="data.photoUrl"
          [profileReady]="profileReadyForReview()"
          [customerProfile]="auth.user()?.role === 'customer'"
          [submitting]="reviewSubmitting()"
          [error]="reviewError()"
          [(rating)]="reviewRating"
          [(comment)]="reviewComment"
          (close)="closeReviewModal()"
          (submitReview)="submitReview()"
        />

        <app-all-reviews-modal
          [open]="showAllReviewsModal()"
          [reviews]="reviews()"
          (close)="closeAllReviewsModal()"
        />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VendorDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly vendorApi = inject(VendorApiService);
  private readonly savedVendors = inject(SavedVendorsService);
  readonly auth = inject(AuthService);
  readonly vendor = signal<Vendor | null>(null);
  readonly reviews = signal<VendorReview[]>([]);
  readonly loading = signal(true);
  readonly reviewsLoading = signal(false);
  readonly showReviewForm = signal(false);
  readonly reviewRating = signal(5);
  readonly reviewComment = signal('');
  readonly reviewSubmitting = signal(false);
  readonly reviewError = signal<string | null>(null);
  readonly showAllReviewsModal = signal(false);

  readonly previewReviews = computed(() => this.reviews().slice(0, REVIEW_PREVIEW_LIMIT));

  readonly stars = ratingStars;

  readonly canSubmitReview = computed(() => {
    const v = this.vendor();
    if (!v) {
      return false;
    }
    const mine = this.vendorApi.myVendor();
    return mine?.id !== v.id;
  });

  readonly canBookmark = this.canSubmitReview;

  readonly isBookmarked = computed(() => {
    const v = this.vendor();
    return v ? this.savedVendors.isSaved(v.id) : false;
  });

  readonly bookmarkBusy = computed(() => {
    const v = this.vendor();
    return v ? this.savedVendors.togglingId() === v.id : false;
  });

  constructor() {
    void this.vendorApi.fetchMyListingSilently();

    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(async (params) => {
      const id = params.get('id');
      if (!id) {
        this.vendor.set(null);
        this.reviews.set([]);
        this.loading.set(false);
        this.reviewsLoading.set(false);
        this.resetReviewForm();
        this.showAllReviewsModal.set(false);
        return;
      }
      this.loading.set(true);
      this.reviewsLoading.set(true);
      this.vendor.set(null);
      this.reviews.set([]);
      this.resetReviewForm();
      this.showAllReviewsModal.set(false);
      const v = await this.vendorApi.fetchVendorById(id);
      this.vendor.set(v);
      if (v) {
        this.vendorApi.recordVendorEvent(v.id, 'view');
        const reviewRows = await this.vendorApi.fetchVendorReviews(v.id);
        this.reviews.set(reviewRows);
      }
      this.loading.set(false);
      this.reviewsLoading.set(false);
    });
  }

  profileReadyForReview(): boolean {
    const user = this.auth.user();
    if (!user) {
      return false;
    }
    if (user.name?.trim()) {
      return true;
    }
    if (user.role === 'vendor') {
      return !!this.vendorApi.myVendor()?.name?.trim();
    }
    return false;
  }

  toggleBookmark(): void {
    const v = this.vendor();
    if (!v || !this.canBookmark()) {
      return;
    }
    void this.savedVendors.toggle(v.id);
  }

  openReviewModal(): void {
    this.reviewError.set(null);
    this.showReviewForm.set(true);
  }

  closeReviewModal(): void {
    if (!this.reviewSubmitting()) {
      this.resetReviewForm();
    }
  }

  openAllReviewsModal(): void {
    this.showAllReviewsModal.set(true);
  }

  closeAllReviewsModal(): void {
    this.showAllReviewsModal.set(false);
  }

  async submitReview(): Promise<void> {
    const v = this.vendor();
    if (!v || !this.profileReadyForReview()) {
      return;
    }

    const comment = this.reviewComment().trim();
    if (!comment) {
      this.reviewError.set('Please write a review comment.');
      return;
    }

    this.reviewSubmitting.set(true);
    this.reviewError.set(null);
    try {
      const created = await this.vendorApi.submitVendorReview(v.id, {
        rating: this.reviewRating(),
        comment,
      });
      this.reviews.update((rows) => [created, ...rows]);
      this.resetReviewForm();
    } catch (err) {
      this.reviewError.set(this.reviewErrorMessage(err));
    } finally {
      this.reviewSubmitting.set(false);
    }
  }

  private resetReviewForm(): void {
    this.showReviewForm.set(false);
    this.reviewRating.set(5);
    this.reviewComment.set('');
    this.reviewError.set(null);
    this.reviewSubmitting.set(false);
  }

  private reviewErrorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      const body = err.error as { message?: string } | string | null;
      if (typeof body === 'string' && body.trim()) {
        return body;
      }
      if (body && typeof body === 'object' && typeof body.message === 'string') {
        return body.message;
      }
      if (err.status === 403) {
        return 'You cannot review your own listing.';
      }
    }
    return 'Could not submit your review. Please try again.';
  }

  pageTitle(): string {
    const v = this.vendor();
    if (v) {
      return v.name;
    }
    return this.loading() ? 'Vendor' : 'Vendor not found';
  }

  prettyCategory(category: string): string {
    return category.replace('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }

  serviceInitial(name: string): string {
    return name.trim().charAt(0).toUpperCase() || '?';
  }

  whatsApp(phone: string): string {
    return getWhatsappUrl(phone, 'Hi, I found you on YNR Local. Are you available?');
  }
}
