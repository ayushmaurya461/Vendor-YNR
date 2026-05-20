import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { ToggleComponent } from './shared/ui/toggle.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToggleComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isVendor = computed(() => this.authService.role() === 'vendor');
  readonly isSidebarOpen = signal(false);
  readonly sidebarPanel = signal<'main' | 'settings'>('main');

  openSidebar(): void {
    this.isSidebarOpen.set(true);
  }

  closeSidebar(): void {
    this.isSidebarOpen.set(false);
    this.sidebarPanel.set('main');
  }

  openSettingsPanel(): void {
    this.sidebarPanel.set('settings');
  }

  closeSettingsPanel(): void {
    this.sidebarPanel.set('main');
  }

  logout(): void {
    this.authService.logout();
    this.closeSidebar();
    void this.router.navigateByUrl('/');
  }

  onDarkModeChange(enabled: boolean): void {
    this.themeService.setDark(enabled);
  }
}
