import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Cell shape for one slot in a skeleton grid row */
export type SkeletonCell =
  | 'line-xs'
  | 'line-sm'
  | 'line'
  | 'line-lg'
  | 'heading'
  | 'block'
  | 'block-sm'
  | 'block-lg'
  | 'circle'
  | 'button'
  | 'chip';

/** Rows of skeleton cells; each row is a flex/grid line on the page */
export type SkeletonLayout = SkeletonCell[][];

@Component({
  selector: 'app-skeleton',
  standalone: true,
  styleUrl: './skeleton.component.css',
  template: `
    <div class="skeleton" aria-hidden="true" [attr.aria-busy]="true">
      @for (row of layout(); track $index) {
        <div class="skeleton__row" [style.grid-template-columns]="gridColumns(row)">
          @for (cell of row; track $index) {
            <div class="skeleton__cell skeleton__cell--{{ cell }}"></div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkeletonComponent {
  readonly layout = input.required<SkeletonLayout>();

  gridColumns(row: SkeletonCell[]): string {
    if (row.length === 0) {
      return '1fr';
    }
    return `repeat(${row.length}, minmax(0, 1fr))`;
  }
}
