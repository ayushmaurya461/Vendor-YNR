import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Category, VendorCategory } from '../../../core/models/vendor.model';

@Component({
  selector: 'app-category-filter',
  standalone: true,
  template: `
    <div class="chips">
      @for (category of categories(); track category.id) {
        <button
          class="chip"
          [class.chip--active]="selected() === category.slug"
          type="button"
          (click)="selected.set(category.slug)"
        >
          <span>{{ category.icon }}</span>
          <span>{{ category.label }}</span>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryFilterComponent {
  readonly categories = input.required<Category[]>();
  readonly selected = model<VendorCategory>('all');
}
