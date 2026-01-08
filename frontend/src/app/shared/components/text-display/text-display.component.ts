import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-text-display',
  imports: [NgClass],
  templateUrl: './text-display.component.html',
  styleUrl: './text-display.component.css'
})
export class TextDisplayComponent {
  @Input() title = '';
  @Input() variant: 'white' | 'beige' = 'white';
  @Input() title_align: 'center' | 'right' | 'left' = 'center';
}
