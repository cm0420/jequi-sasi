import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-back-link',
  standalone: true,
  imports: [RouterLink],
  template: `
    <a
      [routerLink]="to"
      class="inline-flex items-center gap-1.5 font-body text-sm uppercase tracking-wide text-ink/60 hover:text-forest transition-colors mb-8"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M15,4 L7,12 L15,20" />
      </svg>
      {{ label }}
    </a>
  `,
})
export class BackLinkComponent {
  @Input({ required: true }) to!: string | unknown[];
  @Input({ required: true }) label!: string;
}
