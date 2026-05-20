import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { VendorDetailComponent } from './features/vendors/vendor-detail.component';
import { VendorListingsComponent } from './features/vendors/vendor-listings.component';
import { LoginComponent } from './features/auth/login.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ProfileSetupComponent } from './features/profile/profile-setup.component';
import { VendorDashboardComponent } from './features/dashboard/vendor-dashboard.component';
import { RegisterWizardComponent } from './features/register/register-wizard.component';
import { SavedVendorsComponent } from './features/saved/saved-vendors.component';
import { authGuard } from './core/guards/auth.guard';
import { loginRedirectGuard, roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginRedirectGuard],
  },
  {
    path: '',
    component: HomeComponent,
    canActivate: [authGuard],
  },
  {
    path: 'saved',
    component: SavedVendorsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'vendors',
    component: VendorListingsComponent,
    canActivate: [authGuard],
  },
  {
    path: 'vendors/:id',
    component: VendorDetailComponent,
    canActivate: [authGuard],
  },
  {
    path: 'profile/setup',
    component: ProfileSetupComponent,
    canActivate: [authGuard, roleGuard('customer')],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard, roleGuard('customer')],
  },
  {
    path: 'dashboard',
    component: VendorDashboardComponent,
    canActivate: [authGuard, roleGuard('vendor')],
  },
  {
    path: 'register',
    component: RegisterWizardComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
