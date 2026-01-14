import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Post } from '../../models/post.model';
import { NgFor, NgIf } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TextDisplayComponent } from '../../../shared/components/text-display/text-display.component';
import { OrangButtonComponent } from '../../../shared/components/orang-button/orang-button.component';
import { PostService } from '../../../core/post/post.service';
import { UserService } from '../../../core/user/user.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  imports: [NgIf, NgFor, TextDisplayComponent, OrangButtonComponent],
  styleUrls: ['./post-card.component.scss'], 
})
export class PostCardComponent {
  @Input() post!: Post;

  user: User | null = null;
  isLoading = false;
  
  constructor(
    private postService: PostService,
    private userService: UserService,
    private route: ActivatedRoute
  ) {}


  @Input() showActions = true;
  @Input() currentUserId?: string;

  /* Keep outputs so parent components don't break */
  @Output() like = new EventEmitter<string>();
  @Output() share = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  newComment = '';
  showComments = false;
  comments: any[] = [];
  loadingComments = false;

  /* ============================
     Time formatting
     ============================ */
  get timeAgo(): string {
    const now = new Date();
    const postDate = new Date(this.post.created_at);
    const diffMs = now.getTime() - postDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return postDate.toLocaleDateString();
  }

  ngOnInit() {
    // Get user ID from route parameters
    const userId = this.route.snapshot.paramMap.get('id');
    
    if (userId) {
      this.loadUser(userId);
    }
  }
  
  loadUser(id: string): void {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user = user;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load user:', error);
        this.isLoading = false;
      }
    });
  }


  /* ============================
     Comments
     ============================ */
  toggleComments(): void {
    this.showComments = !this.showComments;

    if (this.showComments && this.comments.length === 0) {
      this.loadComments();
    }
  }

  loadComments(): void {
    this.loadingComments = true;

    this.postService.getComments(this.post.id).subscribe({
      next: (comments) => {
        this.comments = comments;
        this.loadingComments = false;
      },
      error: () => {
        this.loadingComments = false;
      }
    });
  }

  addComment(): void {
    if (!this.newComment.trim()) return;

    this.postService.addComment(this.post.id, {
      text: this.newComment
    }).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.newComment = '';
      }
    });
  }

  /* ============================
     Reactions
     ============================ */
  toggleLike(): void {
    this.postService.toggleReaction(this.post.id, 'like').subscribe(() => {
      this.like.emit(this.post.id);
    });
  }

  /* ============================
     Post actions
     ============================ */
  deletePost(): void {
    this.postService.deletePost(this.post.id).subscribe(() => {
      this.delete.emit(this.post.id);
    });
  }

  sharePost(): void {
    this.share.emit(this.post.id);
  }
}
