import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from '../../../shared/components/navbar/main/navbar.component';
//import { ProfileDropdownComponent } from '../../../shared/components/navbar/profile-dropdown/profile-dropdown.component';
import { WallComponent } from '../../../shared/components/wall/wall.component';
import { LeftSidebarComponent } from '../left-sidebar/left-sidebar.component';
import { RightSidebarComponent } from '../right-sidebar/right-sidebar.component';
//import { OrangButtonComponent } from '../../../shared/components/orang-button/orang-button.component';
 
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NavbarComponent, WallComponent, LeftSidebarComponent, RightSidebarComponent], // Import navbar tutaj
  
  template: ` 
   <app-navbar></app-navbar>

<table style="width: 100%; border-collapse: collapse; border: none;background: var(--o-bwhite);">
  <tr>
    <!-- Left Sidebar -->
    <td 
    [style.width.px]="leftSidebarWidth"
    style="vertical-align: top; border: none;">
      <app-left-sidebar></app-left-sidebar>
    </td>

    <!-- Center wall -->
    <td 
    [style.width.px]="wallBoxWidth"
    style="vertical-align: top; padding: 20px; border: none;">
      <app-wall></app-wall>
    </td>

    <!-- Right Sidebar -->
    <td 
    [style.width.px]="rightSidebarWidth"
    style="vertical-align: top; border: none;">
      <app-right-sidebar></app-right-sidebar>
    </td>
  </tr>
</table>

  `,
  styles: []
})
export class HomeComponent {
  leftSidebarWidth = 300;
  wallBoxWidth = 500;
  rightSidebarWidth = 300;

  constructor() {
    this.updateSidebarWidths(window.innerWidth);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.updateSidebarWidths(event.target.innerWidth);
  }

  updateSidebarWidths(width: number) {
    if (width < 900) {
      // mobile: hide left sidebar
      this.leftSidebarWidth = 0;
      this.rightSidebarWidth = 0;
      this.wallBoxWidth = width;
    } else if (width < 1200) {
      // medium screens: hide right sidebar only
      this.leftSidebarWidth = 240;
      this.rightSidebarWidth = 280;
      this.wallBoxWidth = width - 560;
    } else {
      // large screens: both sidebars
      this.leftSidebarWidth = 280;
      this.rightSidebarWidth = 300;
      this.wallBoxWidth = width - 600;
    }
  }
}