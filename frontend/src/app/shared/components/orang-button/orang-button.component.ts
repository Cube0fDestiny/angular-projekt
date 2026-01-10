import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'orang-button',
  imports: [NgClass],
  templateUrl: './orang-button.component.html',
  styleUrl: './orang-button.component.css'
})
export class OrangButtonComponent {
activeClasses = `
  bg-[#F4991A]
  ring-8 ring-[#F4991A]
  hover:bg-[#d98415]   /* slightly darker */
  hover:ring-[#d98415] /* slightly darker */
`;

inactiveClasses = `
  bg-[#344F1F]
  ring-8 ring-[#344F1F]
  hover:bg-[#2a3a14]   /* slightly darker */
  hover:ring-[#2a3a14] /* slightly darker */
`;

  @Input() isActive = false;
}
