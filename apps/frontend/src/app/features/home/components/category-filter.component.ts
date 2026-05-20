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
    <div class="category-filter">
      <div
        class="category-filter__panel"
        [class.category-filter__panel--expanded]="expanded()"
      >
        <div class="category-filter__body">
          @if (!expanded()) {
            <div class="chips" animate.leave="chips-swap-leave">
              @for (category of collapsedCategories(); track category.id) {
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
          } @else {
            <div
              class="category-filter__groups"
              animate.enter="category-panel-enter"
              animate.leave="category-panel-leave"
            >
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
          }
        </div>

        @if (hasMore()) {
          <button
            class="expand-btn"
            [class.expand-btn--expanded]="expanded()"
            type="button"
            [attr.aria-expanded]="expanded()"
            [attr.aria-label]="expanded() ? 'Show fewer categories' : 'Show all categories'"
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
            <span class="expand-btn__label">{{ expanded() ? 'Less' : 'More' }}</span>
          </button>
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
  }

  toggleExpanded(): void {
    this.expanded.update((open) => !open);
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
