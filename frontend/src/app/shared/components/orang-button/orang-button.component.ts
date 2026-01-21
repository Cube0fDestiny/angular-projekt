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

  activeClasses = `
    bg-[var(--o-orange)]
    ring-8 ring-[var(--o-orange)]
    hover:bg-[var(--o-dorange)]
    hover:ring-[var(--o-dorange)]
  `;

  inactiveClasses = `
    bg-[var(--o-green)]
    ring-8 ring-[var(--o-green)]
    hover:bg-[var(--o-dgreen)]
    hover:ring-[var(--o-dgreen)]
  `;

  get sizeClasses() {
    switch (this.size) {
      case 'small':
        return 'px-0 py-0 text-sm ring-1';
      default:
        return 'px-2 py-1 text-xl ring-8';
    }
  }

  toggleActive(event: Event) {
    if (this.istoggleable) {
      this.isActive = !this.isActive;
    }
  }

}

