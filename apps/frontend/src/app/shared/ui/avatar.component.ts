import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { getInitials } from '../utils/initials.util';

@Component({
  selector: 'app-avatar',
  standalone: true,
  styleUrl: './avatar.component.css',
  template: `
    @if (photoUrl()?.trim()) {
      <img class="avatar avatar--image" [src]="photoUrl()!" [alt]="name()" />
    } @else {
      <span class="avatar">{{ initials() }}</span>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  readonly name = input.required<string>();
  readonly photoUrl = input<string>();
  readonly initials = computed(() => getInitials(this.name()));
}
