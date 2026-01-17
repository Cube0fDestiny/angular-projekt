import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from "@angular/common";
import { Post } from '../../../shared/models/post.model';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { OrangButtonComponent } from '../../../shared/components/orang-button/orang-button.component';
import { PostService } from '../../../core/post/post.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { TextDisplayComponent } from '../text-display/text-display.component';
import { User } from '../../models/user.model';
import { UserService } from '../../../core/user/user.service';

@Component({
  selector: 'app-wall',
  templateUrl: './wall.component.html',
  styleUrls: ['./wall.component.scss'],
  imports: [NgIf, PostCardComponent, NgForOf, OrangButtonComponent, TextDisplayComponent, FormsModule]
})
export class WallComponent implements OnInit {
  // Accept ANY number of posts from parent
  @Input() posts: Post[] = [];
  @Input() location_type: 'wall' | 'profile' | 'group' | 'event' = 'wall';
  @Input() location_id: string = '';

  currentUser!: User | null;

  newPost = '';
  isCreatingPost = false;

  constructor(
    private postService: PostService,
    private userService: UserService
  ) {}
  


  toggleCreatingPost():void {
    this.isCreatingPost = !this.isCreatingPost;
  }

  createPost():void {
    if (!this.currentUser) return;
    
    if (!this.newPost?.trim()) {
      this.isCreatingPost = false;
      return;
    }
    
    const createdPost = {
      content: this.newPost,
      location_id: this.location_id,
      location_type: this.location_type 
    };

    this.postService.createPost(createdPost).subscribe({
      next: () => {
        console.log('Successfully created new post');
        this.isCreatingPost = false;
        this.loadAllPosts()
      },
      error: (error) => {
        console.error('Failed to create new post:', error);
        this.isCreatingPost = false;
      }
    });
  }

  isLoading = false;
  error: string | null = null;
  private postsSubscription!: Subscription;

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
  

  onPostDeleted(deletedPostId: string): void {
    console.log('Post was deleted, refreshing...');
    this.loadAllPosts(); // Refresh the list
    
    // OR remove from local array without full refresh:
    // this.posts = this.posts.filter(post => post.id !== deletedPostId);
    // this.loadPosts();
  }



  // Load posts with pagination
  loadPosts(): void {
    const startIndex = 0;
    const endIndex = this.currentPage * this.postsPerPage;
    this.displayedPosts = this.posts.slice(startIndex, endIndex);
  }
   
  
  ngOnInit() {
    this.userService.currentUser$.subscribe(user => this.currentUser = user);
    this.loadAllPosts();
  }
  
  loadAllPosts(): void {
    this.isLoading = true;
    this.error = null;

    this.postsSubscription = this.postService.getAllPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.isLoading = false;
        this.loadPosts();
      },
      error: (error) => {
        this.error = 'Failed to load posts. Please try again later.';
        this.isLoading = false;
        console.error('Error loading posts:', error);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.postsSubscription) {
      this.postsSubscription.unsubscribe();
    }
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
  
}