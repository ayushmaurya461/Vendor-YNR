import { ChangeDetectionStrategy, Component, HostListener, effect, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { VendorReview } from '../../core/models/vendor.model';
import { ratingStars } from '../utils/rating-stars.util';

@Component({
  selector: 'app-all-reviews-modal',
  standalone: true,
  styleUrls: ['./review-list.css', './all-reviews-modal.component.css'],
  imports: [DatePipe],
  template: `
    @if (open()) {
      <div class="reviews-modal" role="dialog" aria-modal="true" aria-labelledby="all-reviews-title">
        <button
          type="button"
          class="reviews-modal__backdrop"
          aria-label="Close reviews"
          (click)="close.emit()"
        ></button>

        <div class="reviews-modal__panel">
          <header class="reviews-modal__header">
            <h2 id="all-reviews-title" class="reviews-modal__title">
              All reviews
              @if (reviews().length > 0) {
                <span class="reviews-modal__count muted">({{ reviews().length }})</span>
              }
            </h2>
            <button
              type="button"
              class="reviews-modal__close"
              aria-label="Close"
              (click)="close.emit()"
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>

          @if (reviews().length === 0) {
            <p class="reviews-modal__empty muted">No reviews yet.</p>
          } @else {
            <ul class="review-list">
              @for (review of reviews(); track review.id) {
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
          }
        </div>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AllReviewsModalComponent {
  readonly open = input(false);
  readonly reviews = input<VendorReview[]>([]);

  readonly close = output<void>();

  readonly stars = ratingStars;

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
}
