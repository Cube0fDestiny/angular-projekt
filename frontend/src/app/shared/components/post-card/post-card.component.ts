import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Post } from '../../models/post.model';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TextDisplayComponent } from '../../../shared/components/text-display/text-display.component';
import { OrangButtonComponent } from '../../../shared/components/orang-button/orang-button.component';
import { PostService } from '../../../core/post/post.service';
import { UserService } from '../../../core/user/user.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  standalone: true,
  imports: [NgIf, FormsModule, NgFor, TextDisplayComponent, OrangButtonComponent],
})
export class PostCardComponent implements OnInit {
  @Input() post!: Post;
  @Input() showActions = true;
  @Input() currentUserId?: string;
  
  /* Events */
  @Output() postDeleted = new EventEmitter<string>(); // Emit post ID when deleted
  @Output() like = new EventEmitter<string>();
  @Output() share = new EventEmitter<string>();

  /* User & State */
  currentUser: User | null = null;
  user: User | null = null;
  userReacted: boolean = false;
  isLoading = false;

  /* UI State: Copy/Share */
  copied = false;
  isCopying = false;
  copyButtonText = '🔄 Squeeze';
  
  /* Counters */
  orang_count = 0;
  comment_count = 0;

  /* Comments & Forms */
  newComment = '';
  showComments = false;
  comments: any[] = [];
  loadingComments = false;
  replyText = '';
  
  /* Edit Post State */
  showEditPostForm = false;
  editPostText = '';

  constructor(
    private postService: PostService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log(this.post);
    // Initialize counters
    this.orang_count = this.post.orang_count;
    this.comment_count = this.post.comment_count;

    // Load Post Creator
    const userId = this.post.creator_id;
    if (userId) {
      this.loadUser(userId);
    }

    // Load Current User context
    this.currentUser = this.userService.currentUser;

    // Check reaction status
    this.getUserReaction();
  }

  /* ============================
     User & Navigation
     ============================ */

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

  goToProfile(id: string) {
    this.router.navigate(['/']).then(() => { this.router.navigate(['/profile', id]); });
  }

  /* ============================
     Formatting & Utilities
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

  /**
   * FIX: Added missing copyPostLink method to resolve build error
   */
  copyPostLink(postId: string): void {
    if (this.isCopying) return;
    
    this.isCopying = true;
    // Construct the URL (adjust '/post/' path based on your routing)
    const url = `${window.location.origin}/post/${postId}`;

    navigator.clipboard.writeText(url).then(() => {
      this.copied = true;
      this.copyButtonText = '✅ Copied!';
      
      // Reset after 2 seconds
      setTimeout(() => {
        this.copied = false;
        this.isCopying = false;
        this.copyButtonText = '🔄 Squeeze';
      }, 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      this.isCopying = false;
      this.copyButtonText = 'Error';
    });
  }

  /* ============================
     Reactions (Orangs)
     ============================ */

  getUserReaction(): void {
    this.postService.getReaction(this.post.id).subscribe({
      next: (reaction) => {
        this.userReacted = reaction.liked;
      }
    });
  }

  toggleUserReaction(): void {
    this.postService.getReaction(this.post.id).subscribe({
      next: (reaction) => {
        if(reaction.liked){
          this.orang_count = this.orang_count - 1;
        } else {
          this.orang_count = this.orang_count + 1;
        }
        
        this.postService.toggleReaction(this.post.id).subscribe({
          next: () => {
            console.log('correctly toggled reaction');
            this.userReacted = !this.userReacted;
          }
        });
      }
    });
  }

  /* ============================
     Edit & Delete Post
     ============================ */

  toggleEditPostForm(): void {
    this.showEditPostForm = !this.showEditPostForm;
    if (this.showEditPostForm) {
      // Initialize with current post content
      this.editPostText = this.post.Text;
    } else {
      this.editPostText = '';
    }
  }

  cancelEditPost(): void {
    this.showEditPostForm = false;
    this.editPostText = '';
  }

  editPost(): void {
    if (!this.editPostText.trim() || this.editPostText === this.post.Text) {
      this.showEditPostForm = false;
      return;
    }
    
    this.postService.updatePost(this.post.id, this.editPostText).subscribe({
      next: (updatedPost) => {
        this.post.Text = updatedPost.Text;
        this.showEditPostForm = false;
        this.editPostText = '';
        console.log('Post updated successfully');
      },
      error: (error) => {
        console.error('Failed to update post:', error);
      }
    });
  }

  deletePost(): void {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    this.postService.deletePost(this.post.id).subscribe({
      next: (response) => {
        console.log('Post deleted:', response.message);
        this.postDeleted.emit(this.post.id); 
      },
      error: (error) => {
        console.error('Failed to delete post:', error);
      }
    });
  }

  /* ============================
     Comments Logic
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
        // Process synchronously - find parent users from the same batch
        this.comments = comments.map(comment => {
          const enrichedComment: any = {
            ...comment,
            showReplyForm: false
          };

          // If it's a reply, find parent comment and its user info
          if (comment.in_reply_to) {
            const parentComment = comments.find(c => c.id === comment.in_reply_to);
            if (parentComment) {
              enrichedComment.parentUserId = parentComment.creator_id;
            }
          }
          return enrichedComment;
        });

        // Now fetch users and format times
        this.fetchUsersForComments();
        this.getTimeForComments();
        this.loadingComments = false;
      },
      error: () => {
        this.loadingComments = false;
      }
    });
  }

  private getTimeForComments(): void {
    this.comments.forEach((comment) => {
      const now = new Date();
      const commentDate = new Date(comment.created_at);
      const diffMs = now.getTime() - commentDate.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) comment.displayDate = 'Just now';
      else if (diffMins < 60) comment.displayDate = `${diffMins}m ago`;
      else if (diffHours < 24) comment.displayDate = `${diffHours}h ago`;
      else if (diffDays < 7) comment.displayDate = `${diffDays}d ago`;
      else comment.displayDate = commentDate.toLocaleDateString();
    });
  }

  private fetchUsersForComments(): void {
    this.comments.forEach((comment, index) => {
      // Fetch comment author
      this.userService.getUserById(comment.creator_id).subscribe({
        next: (user) => {
          this.comments[index].user = user;
          
          // If we have a parent user ID, fetch that too
          if (comment.parentUserId) {
            this.userService.getUserById(comment.parentUserId).subscribe({
              next: (parentUser) => {
                this.comments[index].parentUser = parentUser;
              }
            });
          }
        }
      });
    });
  }

  addComment(): void {
    if (!this.newComment.trim()) return;
    
    this.postService.addComment(this.post.id, {
      text: this.newComment,
    }).subscribe({
      next: (comment) => {
        const enrichedComment = this.createLocalCommentObject(comment, false);
        this.comments.unshift(enrichedComment);
        this.newComment = '';
        this.resetAllSubmitButtons();
        this.comment_count = this.comment_count + 1;
      },
      error: (error) => {
        console.error('Failed to add comment:', error);
      }
    });
  }

  toggleReplyForm(comment: any): void {
    comment.showReplyForm = !comment.showReplyForm;
    if (!comment.showReplyForm) {
      this.replyText = '';
    }
  }

  addReply(comment: any): void {
    if (!this.replyText?.trim()) return;
    
    this.postService.addComment(this.post.id, {
      text: this.replyText,
      in_reply_to: comment.id,
    }).subscribe({
      next: (reply) => {
        const enrichedReply = this.createLocalCommentObject(reply, true, comment);
        
        // Add to beginning of comments array
        this.comments.unshift(enrichedReply);
        
        this.resetAllSubmitButtons();
        comment.showReplyForm = false;
        this.replyText = '';
        this.comment_count = this.comment_count + 1;
      },
      error: (error) => {
        console.error('Failed to add reply:', error);
      }
    });
  }

  // Helper to standardise comment object creation after posting
  private createLocalCommentObject(apiResponse: any, isReply: boolean, parentComment: any = null): any {
    const enriched: any = {
      ...apiResponse,
      user: this.userService.currentUser,
      isReply: isReply,
      showReplyForm: false,
      showEditForm: false,
      displayDate: 'Just now'
    };

    if (isReply && parentComment) {
      enriched.parentUser = parentComment.user;
      enriched.parentUserId = parentComment.creator_id;
    } else {
      enriched.parentUser = null;
    }
    return enriched;
  }

  toggleEditForm(comment: any): void {
    comment.showEditForm = !comment.showEditForm;
    if (comment.showEditForm) {
      comment.editText = comment.text;
    } else {
      comment.editText = '';
    }
  }

  editComment(comment: any): void {
    if (!comment.editText?.trim() || comment.editText === comment.text) {
      comment.showEditForm = false;
      return;
    }
    
    this.postService.updateComment(comment.id, comment.editText).subscribe({
      next: (updatedComment) => {
        comment.text = updatedComment.text;
        comment.editText = '';
        comment.showEditForm = false;
        comment.displayDate = 'Just now'; // Update time indicator
        console.log('Comment updated successfully');
      },
      error: (error) => {
        console.error('Failed to update comment:', error);
      }
    });
  }

  deleteComment(comment: any): void {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    this.postService.deleteComment(comment.id).subscribe({
      next: (response) => {
        const index = this.comments.findIndex(c => c.id === comment.id);
        if (index !== -1) {
          this.comments.splice(index, 1);
        }
        console.log('Comment deleted successfully:', response.message);
        this.comment_count = this.comment_count - 1;
      },
      error: (error) => {
        console.error('Failed to delete comment:', error);
      }
    });
  }

  resetAllSubmitButtons(): void {
    // Note: accessing DOM directly in Angular is generally discouraged, 
    // but preserving your existing logic here.
    const buttons = document.querySelectorAll('orang-button[type="submit"]');
    buttons.forEach(button => {
      (button as any).isActive = true;
    });
  }
}