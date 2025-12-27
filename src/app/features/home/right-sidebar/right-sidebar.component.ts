import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-right-sidebar',
  templateUrl: './right-sidebar.component.html',
  imports: [NgFor,NgIf],
  styleUrls: ['./right-sidebar.component.scss']
})
export class RightSidebarComponent implements OnInit {
  // Online friends
  onlineFriends = [
    {
      id: 1,
      name: 'Jane Smith',
      avatar: 'https://i.pravatar.cc/150?img=2',
      status: 'online',
      lastActive: '2 min ago'
    },
    {
      id: 2,
      name: 'Bob Johnson',
      avatar: 'https://i.pravatar.cc/150?img=3',
      status: 'online',
      lastActive: '5 min ago'
    },
    {
      id: 3,
      name: 'Alice Williams',
      avatar: 'https://i.pravatar.cc/150?img=4',
      status: 'online',
      lastActive: 'Just now'
    }
  ];
  
  // Recent profiles
  recentProfiles = [
    {
      id: 4,
      name: 'Charlie Brown',
      avatar: 'https://i.pravatar.cc/150?img=5',
      mutualFriends: 12,
      lastActive: '1 hour ago'
    },
    {
      id: 5,
      name: 'Emma Wilson',
      avatar: 'https://i.pravatar.cc/150?img=6',
      mutualFriends: 8,
      lastActive: '3 hours ago'
    },
    {
      id: 6,
      name: 'David Lee',
      avatar: 'https://i.pravatar.cc/150?img=7',
      mutualFriends: 5,
      lastActive: 'Yesterday'
    }
  ];
  
  // Friend requests
  friendRequests = [
    {
      id: 7,
      name: 'Sarah Miller',
      avatar: 'https://i.pravatar.cc/150?img=8',
      mutualFriends: 3
    },
    {
      id: 8,
      name: 'Mike Taylor',
      avatar: 'https://i.pravatar.cc/150?img=9',
      mutualFriends: 7
    }
  ];
  
  // Birthdays
  birthdays = [
    {
      id: 9,
      name: 'John Doe',
      avatar: 'https://i.pravatar.cc/150?img=1',
      today: true
    },
    {
      id: 10,
      name: 'Lisa Wang',
      avatar: 'https://i.pravatar.cc/150?img=10',
      today: false,
      date: 'Tomorrow'
    }
  ];
  
  // Sponsored/Ads
  sponsored = [
    {
      id: 1,
      title: 'Learn Angular Pro',
      description: 'Master Angular in 30 days',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=200',
      link: '#'
    }
  ];
  
  ngOnInit() {
    // In real app, load from service
  }
  
  onFriendClick(friend: any): void {
    console.log('Friend clicked:', friend.name);
    // Navigate to profile
  }
  
  acceptRequest(requestId: number): void {
    console.log('Accepted request:', requestId);
    // Update UI
    this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
  }
  
  rejectRequest(requestId: number): void {
    console.log('Rejected request:', requestId);
    this.friendRequests = this.friendRequests.filter(r => r.id !== requestId);
  }
  
  sendMessage(userId: number): void {
    console.log('Send message to:', userId);
  }
}