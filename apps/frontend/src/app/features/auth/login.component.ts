import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import type { UserRole } from '../../core/models/user.model';
import { AuthService } from '../../core/services/auth.service';
import { SidebarService } from '../../core/services/sidebar.service';
import { OtpInputComponent } from '../../shared/ui/otp-input.component';
import { ToggleComponent } from '../../shared/ui/toggle.component';
@Component({
  selector: 'app-login',
  standalone: true,
  styleUrl: './login.component.css',
  imports: [FormsModule, RouterLink, OtpInputComponent, ToggleComponent],
  template: `
    <section class="view view--center">
      <div class="auth-card card">

        @if (!otpStep()) {
          <div class="auth-block">
            <p class="auth-title">Welcome to YNR Local</p>
            <p class="muted">Enter your phone number to continue</p>
            <label class="muted">Phone number</label>
            <div class="phone-row">
              <span class="input phone-prefix">+91</span>
              <input class="input" [(ngModel)]="phoneModel" placeholder="98765 43210" />
            </div>
            <app-toggle
              [(checked)]="vendorSignup"
              ariaLabel="Create as vendor account for new signups"
            >
              <span class="muted">Create as vendor account (new signups)</span>
            </app-toggle>
            @if (formError()) {
              <p class="form-error" role="alert">{{ formError() }}</p>
            }
            <button class="btn btn--secondary" [disabled]="busy()" (click)="sendOtp()">Send OTP</button>
            <p class="muted">Are you a vendor? <a routerLink="/register">Register listing</a> (requires vendor login)</p>
          </div>
        } @else {
          <div class="auth-block">
            <p class="auth-title">Enter OTP</p>
            <p class="muted">Sent to +91 {{ phone() }}</p>
            <app-otp-input [(value)]="otp" />
            @if (formError()) {
              <p class="form-error" role="alert">{{ formError() }}</p>
            }
            <button class="btn btn--secondary" [disabled]="otp().length !== 4 || busy()" (click)="verifyOtp()">
              Verify & continue
            </button>
            <button class="btn btn--ghost" [disabled]="resendTimer() > 0 || busy()" (click)="resetOtp()">
              {{ resendLabel() }}
            </button>
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sidebar = inject(SidebarService);

  /** Phone input binds as string via ngModel; sync into signal before API calls */
  phoneModel = '';
  vendorSignup = false;

  readonly phone = signal('');
  readonly otpStep = signal(false);
  readonly otp = signal('');
  readonly busy = signal(false);
  readonly formError = signal('');
  readonly resendTimer = signal(30);
  readonly resendLabel = computed(() =>
    this.resendTimer() > 0 ? `Resend OTP in ${this.resendTimer()}s` : 'Resend OTP',
  );
  private timerId?: ReturnType<typeof setInterval>;

  constructor() {
    this.sidebar.close();
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  sendOtp(): void {
    const digits = normalizePhoneDigits(this.phoneModel.trim());
    if (digits === '') {
      this.formError.set('Enter your phone number');
      return;
    }
    this.phone.set(digits);
    this.phoneModel = digits;
    this.formError.set('');
    this.busy.set(true);
    void this.auth
      .sendOtp(digits)
      .then(() => {
        this.otpStep.set(true);
        this.otp.set('');
        this.resendTimer.set(30);
        this.startTimer();
      })
      .catch(() =>
        this.formError.set(
          'Could not send OTP (check API URL, MSG91/dev settings, or try again shortly).',
        ),
      )
      .finally(() => this.busy.set(false));
  }

  resetOtp(): void {
    this.formError.set('');
    this.otp.set('');
    this.busy.set(true);
    const digits = normalizePhoneDigits(this.phone());
    void this.auth
      .sendOtp(digits)
      .catch(() =>
        this.formError.set(
          'Could not resend OTP (check API URL, MSG91/dev settings, or try again shortly).',
        ),
      )
      .finally(() => this.busy.set(false));
    this.resendTimer.set(30);
    this.startTimer();
  }

  verifyOtp(): void {
    this.formError.set('');
    const digits = normalizePhoneDigits(this.phone());
    if (digits.length < 10) {
      this.formError.set('Phone number looks invalid. Please resend OTP.');
      return;
    }
    const roleExplicit: UserRole | undefined = this.vendorSignup ? 'vendor' : undefined;

    this.busy.set(true);
    void this.auth
      .verifyOtp(digits, this.otp().trim(), roleExplicit)
      .then(() => this.afterVerify())
      .catch(() => this.formError.set('OTP invalid or expired. Try again.'))
      .finally(() => this.busy.set(false));
  }

  private afterVerify(): void {
    const user = this.auth.user();
    if (!user) {
      return;
    }
    if (user.role === 'vendor') {
      void this.router.navigateByUrl('/dashboard');
      return;
    }
    if (!user.profileComplete) {
      void this.router.navigateByUrl('/profile/setup');
      return;
    }
    void this.router.navigateByUrl('/');
  }

  private startTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
    this.timerId = setInterval(() => {
      this.resendTimer.update((current) => {
        if (current <= 1) {
          if (this.timerId) {
            clearInterval(this.timerId);
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }
}

function normalizePhoneDigits(raw: string): string {
  return raw.replace(/\D/g, '').trim();
}
