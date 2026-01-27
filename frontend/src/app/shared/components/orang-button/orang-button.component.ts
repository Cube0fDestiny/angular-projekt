import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'orang-button',
  imports: [NgClass],
  templateUrl: './orang-button.component.html',
  styleUrls: ['./orang-button.component.scss']
})
export class OrangButtonComponent {
  @Input() isActive = true;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() size: 'default' | 'small' = 'default';
  @Input() istoggleable = true;
  @Input() disabled = false;

  // Base styles for the "primary" (orange) variant
  activeClasses = `
    bg-[var(--o-orange)]
    ring-8 ring-[var(--o-orange)]
    hover:bg-[var(--o-dorange)]
    hover:ring-[var(--o-dorange)]
    active:bg-[var(--o-dorange)]
    active:ring-[var(--o-dorange)]
  `;

  // Base styles for the "secondary" (green) variant
  inactiveClasses = `
    bg-[var(--o-green)]
    ring-8 ring-[var(--o-green)]
    hover:bg-[var(--o-dgreen)]
    hover:ring-[var(--o-dgreen)]
    active:bg-[var(--o-dgreen)]
    active:ring-[var(--o-dgreen)]
  `;

  get sizeClasses() {
    switch (this.size) {
      case 'small':
        return 'px-0 py-0 text-sm ring-1';
      default:
        return 'px-2 py-1 text-xl ring-8';
    }
  }

  // Do not toggle persistent colors on click; rely on hover/active
  // CSS states for a temporary visual change instead.
  toggleActive(event: Event) {
    return;
  }

}

