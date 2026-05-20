import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { Category, VendorCategory } from '../../../core/models/vendor.model';

const COLLAPSED_VISIBLE = 4;

export interface CategoryLetterGroup {
  letter: string;
  categories: Category[];
}

@Component({
  selector: 'app-category-filter',
  standalone: true,
  styleUrl: './category-filter.component.css',
  template: `
    <div class="category-filter" [class.category-filter--open]="expanded()">
      @if (expanded()) {
        <button
          type="button"
          class="category-filter__backdrop"
          aria-label="Close categories"
          (click)="closeExpanded()"
        ></button>
      }

      <div class="category-filter__surface">
        <div class="category-filter__bar" [class.category-filter__bar--concealed]="expanded()">
          <div class="category-filter__body">
            <div class="chips">
              @for (category of collapsedCategories(); track category.id) {
                <button
                  class="chip"
                  [class.chip--active]="selected() === category.slug"
                  type="button"
                  [tabindex]="expanded() ? -1 : 0"
                  (click)="select(category.slug)"
                >
                  {{ category.label }}
                </button>
              }
            </div>
          </div>

          @if (hasMore() && !expanded()) {
            <button
              class="expand-btn"
              type="button"
              aria-expanded="false"
              aria-label="Show all categories"
              (click)="toggleExpanded()"
            >
              <span class="expand-btn__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="expand-btn__label">More</span>
            </button>
          }
        </div>

        @if (expanded()) {
          <div
            class="category-filter__popup"
            role="dialog"
            aria-label="All categories"
            animate.enter="category-panel-enter"
            animate.leave="category-panel-leave"
          >
            <div class="category-filter__groups">
              @for (group of letterGroups(); track group.letter; let i = $index) {
                <section
                  class="letter-group"
                  animate.enter="letter-group-enter"
                  [style.animation-delay.ms]="i * 45"
                >
                  <h4 class="letter-group__heading">{{ group.letter }}</h4>
                  <div class="chips">
                    @for (category of group.categories; track category.id) {
                      <button
                        class="chip"
                        [class.chip--active]="selected() === category.slug"
                        type="button"
                        (click)="select(category.slug)"
                      >
                        {{ category.label }}
                      </button>
                    }
                  </div>
                </section>
              }
            </div>

            @if (hasMore()) {
              <div class="category-filter__footer">
                <button
                  class="expand-btn expand-btn--expanded"
                  type="button"
                  aria-expanded="true"
                  aria-label="Show fewer categories"
                  (click)="closeExpanded()"
                >
                  <span class="expand-btn__icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
                      <path
                        d="M6 9l6 6 6-6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </span>
                  <span class="expand-btn__label">Less</span>
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFilterComponent {
  readonly categories = input.required<Category[]>();
  readonly selected = model<VendorCategory>('all');
  readonly expanded = signal(false);

  readonly hasMore = computed(() => this.categories().length > COLLAPSED_VISIBLE);

  readonly collapsedCategories = computed(() => {
    const all = this.categories();
    const primary = all.slice(0, COLLAPSED_VISIBLE);
    const current = all.find((c) => c.slug === this.selected());
    if (!current || primary.some((c) => c.slug === current.slug)) {
      return primary;
    }
    return [...primary.slice(0, COLLAPSED_VISIBLE - 1), current];
  });

  readonly letterGroups = computed(() => groupCategoriesByLetter(this.categories()));

  select(slug: VendorCategory): void {
    this.selected.set(slug);
    if (this.expanded()) {
      this.closeExpanded();
    }
  }

  toggleExpanded(): void {
    this.expanded.set(true);
  }

  closeExpanded(): void {
    this.expanded.set(false);
  }
}

function groupCategoriesByLetter(categories: Category[]): CategoryLetterGroup[] {
  const sorted = [...categories].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: 'base' }),
  );
  const byLetter = new Map<string, Category[]>();

  for (const category of sorted) {
    const letter = category.label.charAt(0).toLocaleUpperCase();
    const bucket = byLetter.get(letter);
    if (bucket) {
      bucket.push(category);
    } else {
      byLetter.set(letter, [category]);
    }
  }

  return [...byLetter.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, groupCategories]) => ({ letter, categories: groupCategories }));
}
