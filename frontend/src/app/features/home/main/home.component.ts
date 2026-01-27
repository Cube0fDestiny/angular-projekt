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
    <div class="w-full bg-(--o-bwhite) min-h-screen flex flex-col">
      <div class="max-w-7xl w-full mx-auto mt-16 sm:mt-18 md:mt-20">
        <div class="flex flex-row w-full">
          <!-- Left Sidebar -->
          <div [style.width.px]="leftSidebarWidth" class="hidden md:block" style="vertical-align: top;">
            <app-left-sidebar></app-left-sidebar>
          </div>
          <!-- Center wall (smaller posts) -->
          <div [style.width.px]="wallBoxWidth" class="flex-1 flex justify-center" style="vertical-align: top; padding: 10px;">
            <app-wall class="small-wall"></app-wall>
          </div>
          <!-- Right Sidebar -->
          <div [style.width.px]="rightSidebarWidth" class="hidden md:block" style="vertical-align: top;">
            <app-right-sidebar></app-right-sidebar>
          </div>
        </div>
      </div>
    </div>
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