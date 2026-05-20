import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  effect,
  input,
  model,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from './avatar.component';

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'] as const;

@Component({
  selector: 'app-submit-review-modal',
  standalone: true,
  styleUrl: './submit-review-modal.component.css',
  imports: [RouterLink, AvatarComponent],
  template: `
    @if (open()) {
      <div class="review-modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
        <button
          type="button"
          class="review-modal__backdrop"
          aria-label="Close review dialog"
          (click)="close.emit()"
        ></button>

        <div class="review-modal__panel">
          <header class="review-modal__header">
            <h2 id="review-modal-title" class="review-modal__title">Review</h2>
            <button
              type="button"
              class="review-modal__close"
              aria-label="Close"
              (click)="close.emit()"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          <div class="review-modal__vendor">
            <app-avatar [name]="vendorName()" [photoUrl]="vendorPhotoUrl()" />
            <div class="review-modal__vendor-text">
              <p class="review-modal__vendor-name">{{ vendorName() }}</p>
              <p class="review-modal__vendor-meta muted">{{ vendorCategory() }} · {{ vendorArea() }}</p>
            </div>
          </div>

          @if (!profileReady()) {
            <p class="review-modal__hint muted">
              @if (customerProfile()) {
                Add your name in
                <a routerLink="/profile/setup" (click)="close.emit()">profile setup</a>
                before submitting a review.
              } @else {
                Complete your vendor listing name before submitting a review.
              }
            </p>
          } @else {
            <form class="review-modal__form" (submit)="onSubmit($event)">
              <p class="review-modal__rating-label">{{ ratingLabel() }}</p>

              <div class="review-modal__stars" role="group" aria-label="Rating from 1 to 5 stars">
                @for (star of [1, 2, 3, 4, 5]; track star) {
                  <button
                    type="button"
                    class="review-modal__star"
                    [attr.aria-label]="star + ' star' + (star === 1 ? '' : 's')"
                    [attr.aria-pressed]="rating() >= star"
                    (click)="rating.set(star)"
                  >
                    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
                      @if (rating() >= star) {
                        <path
                          class="review-modal__star-fill"
                          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                        />
                      } @else {
                        <path
                          class="review-modal__star-outline"
                          d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.563.563 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.563.563 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                          fill="none"
                          stroke-width="1.5"
                        />
                      }
                    </svg>
                  </button>
                }
              </div>

              <label class="review-modal__field-label" for="review-modal-comment">Write your review</label>
              <textarea
                id="review-modal-comment"
                class="input input--textarea review-modal__comment"
                rows="4"
                maxlength="500"
                placeholder="Please share your experience with this vendor…"
                [value]="comment()"
                (input)="comment.set($any($event.target).value)"
              ></textarea>

              @if (error()) {
                <p class="review-modal__error" role="alert">{{ error() }}</p>
              }

              <button
                type="submit"
                class="btn btn--primary review-modal__submit"
                [disabled]="submitting() || !comment().trim()"
              >
                {{ submitting() ? 'Submitting…' : 'Post review' }}
              </button>
            </form>
          }
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubmitReviewModalComponent {
  readonly open = input(false);
  readonly vendorName = input.required<string>();
  readonly vendorCategory = input.required<string>();
  readonly vendorArea = input.required<string>();
  readonly vendorPhotoUrl = input<string>();
  readonly profileReady = input(true);
  readonly customerProfile = input(false);
  readonly submitting = input(false);
  readonly error = input<string | null>(null);

  readonly rating = model(5);
  readonly comment = model('');

  readonly close = output<void>();
  readonly submitReview = output<void>();

  readonly ratingLabel = computed(() => RATING_LABELS[this.rating()] ?? 'Rate this vendor');

  constructor() {
    effect(() => {
      if (typeof document === 'undefined') {
        return;
      }
      document.body.style.overflow = this.open() ? 'hidden' : '';
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) {
      this.close.emit();
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitReview.emit();
  }
}
