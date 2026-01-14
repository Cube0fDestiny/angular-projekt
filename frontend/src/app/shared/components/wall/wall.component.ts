import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, NgIf, NgForOf } from "@angular/common";
import { Post } from '../../../shared/models/post.model';
import { PostCardComponent } from '../../../shared/components/post-card/post-card.component';
import { OrangButtonComponent } from '../../../shared/components/orang-button/orang-button.component';
import { PostService } from '../../../core/post/post.service';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-wall',
  templateUrl: './wall.component.html',
  styleUrls: ['./wall.component.scss'],
  imports: [NgIf, PostCardComponent, NgForOf, OrangButtonComponent]
})
export class WallComponent implements OnInit {
  // Accept ANY number of posts from parent
  @Input() posts: Post[] = [];
  
  constructor(
    private postService: PostService
  ) {}

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
  
  // Load posts with pagination
  loadPosts(): void {
    const startIndex = 0;
    const endIndex = this.currentPage * this.postsPerPage;
    this.displayedPosts = this.posts.slice(startIndex, endIndex);
  }
   
  
  ngOnInit() {
    this.loadAllPosts();
  }
  
  loadAllPosts(): void {
    this.isLoading = true;
    this.error = null;

    this.postsSubscription = this.postService.getAllPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.isLoading = false;
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