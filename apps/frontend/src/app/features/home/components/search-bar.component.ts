import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  styleUrl: './search-bar.component.css',
  imports: [FormsModule],
  template: `
    <label class="search">
      <span class="search__icon" aria-hidden="true">⌕</span>
      <input
        class="input search__input"
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
