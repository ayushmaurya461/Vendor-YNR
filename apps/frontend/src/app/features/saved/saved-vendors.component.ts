import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SavedVendorsService } from '../../core/services/saved-vendors.service';
import { VendorGridComponent } from '../home/components/vendor-grid.component';
import { PageHeaderComponent } from '../../shared/ui/page-header.component';
import { SkeletonComponent, type SkeletonLayout } from '../../shared/ui/skeleton.component';
import { EmptyStateComponent } from '../../shared/ui/empty-state.component';

const SAVED_SKELETON: SkeletonLayout = [['block'], ['block'], ['block']];

@Component({
  selector: 'app-saved-vendors',
  standalone: true,
  styleUrl: './saved-vendors.component.css',
  imports: [RouterLink, VendorGridComponent, PageHeaderComponent, SkeletonComponent, EmptyStateComponent],
  template: `
    <section class="view">
      <app-page-header title="Saved" subtitle="Vendors you bookmarked" />

      @if (saved.loading()) {
        <app-skeleton [layout]="skeleton" />
      } @else if (saved.savedVendors().length === 0) {
        <app-empty-state
          icon="saved"
          title="No saved vendors yet"
          description="Tap the bookmark on a vendor profile to save them here."
        >
          <a class="btn btn--primary" routerLink="/vendors">Find vendors</a>
        </app-empty-state>
      } @else {
        <app-vendor-grid [vendors]="saved.savedVendors()" />
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedVendorsComponent implements OnInit {
  readonly saved = inject(SavedVendorsService);
  readonly skeleton = SAVED_SKELETON;

  ngOnInit(): void {
    void this.saved.refresh();
  }
}
