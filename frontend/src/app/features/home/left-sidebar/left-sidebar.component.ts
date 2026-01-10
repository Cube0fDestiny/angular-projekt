import { Component } from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { NgFor, NgIf } from '@angular/common';
import { OrangButtonComponent } from "../../../shared/components/orang-button/orang-button.component";
@Component({
  selector: 'app-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  imports: [NgFor, NgIf, OrangButtonComponent],
  styleUrls: ['./left-sidebar.component.scss']
})
export class LeftSidebarComponent {

  currentUser: any;
    
    constructor(private userService: UserService) {}
    
    ngOnInit() {
      console.log("FSDJFDSHDS")
      // Subscribe to global user changes
      this.userService.currentUser$.subscribe(user => {
        this.currentUser = user;  // Updates automatically!
      });
    }
  // Groups data
  groups = [
    {
      id: 1,
      name: 'Angular Developers',
      icon: '🅰️',
      members: 2450,
      type: 'public',
      isJoined: true
    },
    {
      id: 2,
      name: 'Web Designers',
      icon: '🎨',
      members: 1890,
      type: 'private',
      isJoined: true
    },
    {
      id: 3,
      name: 'JavaScript Enthusiasts',
      icon: '📜',
      members: 5670,
      type: 'public',
      isJoined: false
    },
    {
      id: 4,
      name: 'DEV 2 Team',
      icon: '🚀',
      members: 12,
      type: 'private',
      isJoined: true
    },
    {
      id: 5,
      name: 'Open Source',
      icon: '🔓',
      members: 3200,
      type: 'public',
      isJoined: true
    }
  ];
  
  // Organizations
  organizations = [
    {
      id: 1,
      name: 'Tech Corp',
      icon: '🏢',
      category: 'Technology',
      members: 540
    },
    {
      id: 2,
      name: 'Design Hub',
      icon: '✨',
      category: 'Design',
      members: 320
    },
    {
      id: 3,
      name: 'Startup Inc',
      icon: '💡',
      category: 'Startup',
      members: 89
    }
  ];
  
  // Quick actions
  quickActions = [
    { label: 'Create Group', icon: '➕', action: 'createGroup' },
    { label: 'Discover', icon: '🔍', action: 'discover' },
    { label: 'Events', icon: '📅', action: 'events' },
    { label: 'Memories', icon: '📸', action: 'memories' }
  ];
  
  onGroupClick(group: any): void {
    console.log('Group clicked:', group.name);
    // Navigate to group page or show details
  }
  
  onOrgClick(org: any): void {
    console.log('Organization clicked:', org.name);
  }
  
  onQuickAction(action: string): void {
    console.log('Quick action:', action);
  }
  
  joinGroup(groupId: number): void {
    const group = this.groups.find(g => g.id === groupId);
    if (group) {
      group.isJoined = !group.isJoined;
      console.log(group.isJoined ? 'Joined' : 'Left', group.name);
    }
  }
}