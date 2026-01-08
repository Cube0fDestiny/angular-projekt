import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from "@angular/common";
import { Post } from '../../../shared/models/post.model';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
@Component({
  selector: 'app-wall',
  templateUrl: './wall.component.html',
  styleUrls: ['./wall.component.scss'],
  imports: [NgIf, PostCardComponent, NgForOf]
})
export class WallComponent implements OnInit {
  // Accept ANY number of posts from parent
  @Input() posts: Post[] = [];
  
  // Optional: Pagination controls
  @Input() showLoadMore = true;
  @Input() postsPerPage = 10;
  
  // Track currently displayed posts
  displayedPosts: Post[] = [];
  currentPage = 1;
  showCreatePost=false;
  // Called when @Input() posts changes
  ngOnChanges() {
    this.loadPosts();
  }
  
  // Load posts with pagination
  loadPosts(): void {
    const startIndex = 0;
    const endIndex = this.currentPage * this.postsPerPage;
    this.displayedPosts = this.posts.slice(startIndex, endIndex);
  }
   
  
  ngOnInit() {
    this.createTestPosts();
  }
  
  createTestPosts() {
    this.posts = [
      {
        id: 1,
        content: 'Just finished the Angular feed! 🎉 This is amazing!',
        location: 'WIELKA LECHIA!!!',
        isEdited: true,
        author: {
          id: 1,
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?img=1'
        },
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        likes: 24,
        comments: [
          {
            likes:4,
            id: 101,
            text: 'Great work! The UI looks awesome!',
            author: {
              id: 2,
              name: 'Jane Smith',
              avatar: 'https://i.pravatar.cc/150?img=2'
            },
            createdAt: new Date(Date.now() - 1800000) // 30 min ago
          },
          {

            likes:3,
            id: 102,
            text: 'When will this be live?',
            author: {
              id: 3,
              name: 'Bob Johnson',
              avatar: 'https://i.pravatar.cc/150?img=3'
            },
            createdAt: new Date(Date.now() - 900000) // 15 min ago
          }
        ],
        shares: 5,
        imageUrl: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=600&auto=format&fit=crop'
      },
      {
        id: 2,
        content: 'Working on the mobile responsive design today 📱 Any suggestions for improvement?',
        author: {
          id: 2,
          name: 'Jane Smith',
          avatar: 'https://i.pravatar.cc/150?img=2'
        },
        createdAt: new Date(Date.now() - 7200000), // 2 hours ago
        likes: 42,
        comments: [],
        shares: 12,
       // imageUrl: null
      },
      {
        id: 3,
        content: 'Just discovered this amazing Angular feature! The reactive forms are so powerful!',
        author: {
          id: 3,
          name: 'Bob Johnson',
          avatar: 'https://i.pravatar.cc/150?img=3'
        },
        createdAt: new Date(Date.now() - 10800000), // 3 hours ago
        likes: 18,
        comments: [
          {
            likes:5,
            id: 103,
            text: 'Which feature exactly?',
            author: {
              id: 1,
              name: 'John Doe',
              avatar: 'https://i.pravatar.cc/150?img=1'
            },
            createdAt: new Date(Date.now() - 9600000) // ~2.5 hours ago
          }
        ],
        shares: 3,
        imageUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&auto=format&fit=crop'
      },
      {
        id: 4,
        content: 'DEV 2 project is coming along nicely! The feed works, user profiles are next!',
        author: {
          id: 4,
          name: 'Alice Williams',
          avatar: 'https://i.pravatar.cc/150?img=4'
        },
        createdAt: new Date(Date.now() - 14400000), // 4 hours ago
        likes: 56,
        comments: [
          {
            likes:6,
            id: 104,
            text: 'Can\'t wait to try it out!',
            author: {
              id: 2,
              name: 'Jane Smith',
              avatar: 'https://i.pravatar.cc/150?img=2'
            },
            createdAt: new Date(Date.now() - 13800000)
          },
          {
            likes:10,
            id: 105,
            text: 'Will there be dark mode?',
            author: {
              id: 3,
              name: 'Bob Johnson',
              avatar: 'https://i.pravatar.cc/150?img=3'
            },
            createdAt: new Date(Date.now() - 13200000)
          }
        ],
        shares: 8,
        //imageUrl: null
      },
      {
        id: 5,
        content: 'Lunch break! 🍕 Who else is working on Angular projects today?',
        author: {
          id: 1,
          name: 'John Doe',
          avatar: 'https://i.pravatar.cc/150?img=1'
        },
        createdAt: new Date(Date.now() - 18000000), // 5 hours ago
        likes: 33,
        comments: [
          {
            likes:40,
            id: 106,
            text: 'Me! Working on a dashboard right now.',
            author: {
              id: 4,
              name: 'Alice Williams',
              avatar: 'https://i.pravatar.cc/150?img=4'
            },
            createdAt: new Date(Date.now() - 17400000)
          }
        ],
        shares: 2,
        imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop'
      }
    ];
    
    console.log(`Created ${this.posts.length} test posts!`);
  }

  // Load more posts
  loadMore(): void {
    this.currentPage++;
    this.loadPosts();
  }
  



  // Check if there are more posts to load
  get hasMorePosts(): boolean {
    return this.displayedPosts.length < this.posts.length;
  }
  
  // Handle post actions
  onLike(postId: number): void {
    console.log('Liked post:', postId);
  }
  
  onComment(postId: number, comment: string): void {
    console.log('Comment on post:', postId, comment);
  }
  
  onShare(postId: number): void {
    console.log('Shared post:', postId);
  }
  
  // Add a new post to the wall
  addPost(newPost: Post): void {
    this.posts.unshift(newPost); // Add to beginning
    this.loadPosts(); // Refresh display
  }
  
  // Remove a post
  removePost(postId: number): void {
    this.posts = this.posts.filter(post => post.id !== postId);
    this.loadPosts();
  }
}