import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SavedVendorsService } from './core/services/saved-vendors.service';
import { VendorApiService } from './core/services/vendor-api.service';
import { SidebarService } from './core/services/sidebar.service';
import { ThemeService } from './core/services/theme.service';
import { ToggleComponent } from './shared/ui/toggle.component';
import { ProgressBarComponent } from './shared/ui/progress-bar.component';
import { ToastContainerComponent } from './shared/ui/toast-container.component';
import { LocationLabelComponent } from './shared/ui/location-label.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ToggleComponent,
    ProgressBarComponent,
    ToastContainerComponent,
    LocationLabelComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly savedVendors = inject(SavedVendorsService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  readonly sidebar = inject(SidebarService);

  private readonly vendorApi = inject(VendorApiService);

  readonly isLoggedIn = this.authService.isLoggedIn;
  readonly isVendor = computed(() => this.authService.role() === 'vendor');
  readonly hasVendorListing = computed(() => this.vendorApi.hasVendorListing());

  constructor() {
    effect(() => {
      if (this.authService.isLoggedIn()) {
        void this.savedVendors.refresh();
        if (this.authService.role() === 'vendor') {
          void this.vendorApi.fetchMyListingsSilently();
        }
      } else {
        this.savedVendors.clear();
      }
    });
  }

  closeSidebar(): void {
    this.sidebar.close();
  }

  openSettingsPanel(): void {
    this.sidebar.openSettings();
  }

  closeSettingsPanel(): void {
    this.sidebar.closeSettings();
  }

  logout(): void {
    this.authService.logout();
    this.sidebar.close();
    void this.router.navigateByUrl('/login');
  }

  onDarkModeChange(enabled: boolean): void {
    this.themeService.setDark(enabled);
  }
}
