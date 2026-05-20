import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  styleUrl: './profile-setup.component.css',
  imports: [ReactiveFormsModule, PageHeaderComponent],
  template: `
    <section class="view view--center">
      <div class="auth-card card">
        <app-page-header title="Set up your profile" variant="static" />
        <form [formGroup]="form" class="auth-block" (ngSubmit)="save()">
          <label>Name</label>
          <input class="input" formControlName="name" />
          <label>Area / locality</label>
          <input class="input" formControlName="area" />
          <button class="btn btn--primary" type="submit">Save & continue</button>
        </form>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSetupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    name: [this.auth.user()?.name ?? '', [Validators.required]],
    area: [this.auth.user()?.area ?? '', [Validators.required]],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, area } = this.form.getRawValue();
    void this.auth.patchProfile({ name, area }).then(() => {
      void this.router.navigateByUrl('/profile');
    });
  }
}
