import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="search">
      <span class="search__icon">⌕</span>
      <input
        class="input"
        type="search"
        placeholder="Search electrician, plumber, gardener..."
        [ngModel]="query()"
        (ngModelChange)="query.set($event)"
      />
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBarComponent {
  readonly query = model('');
}
