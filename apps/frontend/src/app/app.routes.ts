import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { VendorDetailComponent } from './features/vendors/vendor-detail.component';
import { LoginComponent } from './features/auth/login.component';
import { ProfileComponent } from './features/profile/profile.component';
import { ProfileSetupComponent } from './features/profile/profile-setup.component';
import { VendorDashboardComponent } from './features/dashboard/vendor-dashboard.component';
import { RegisterWizardComponent } from './features/register/register-wizard.component';
import { authGuard } from './core/guards/auth.guard';
import { loginRedirectGuard, roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
  },
  {
    path: 'vendors/:id',
    component: VendorDetailComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [loginRedirectGuard],
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
    redirectTo: '',
  },
];
