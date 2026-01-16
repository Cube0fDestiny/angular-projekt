import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Post } from '../../models/post.model';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TextDisplayComponent } from '../../../shared/components/text-display/text-display.component';
import { OrangButtonComponent } from '../../../shared/components/orang-button/orang-button.component';
import { PostService } from '../../../core/post/post.service';
import { UserService } from '../../../core/user/user.service';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  imports: [NgIf, FormsModule, NgFor, TextDisplayComponent, OrangButtonComponent],
  styleUrls: ['./post-card.component.scss'], 
})
export class PostCardComponent {
  @Input() post!: Post;


  user: User | null = null;
  isLoading = false;
  
  constructor(
    private postService: PostService,
    private userService: UserService,
    private router: Router
  ) {}


  @Input() showActions = true;
  @Input() currentUserId?: string;
  currentUser: User | null = null;

  /* Keep outputs so parent components don't break */
  @Output() like = new EventEmitter<string>();
  @Output() share = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  newComment = '';
  showComments = false;
  comments: any[] = [];
  loadingComments = false;
  replyText = '';
  editText = '';

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


  goToProfile(id: string) {
    this.router.navigate(['/']).then(() => { this.router.navigate(['/profile', id]); });
  }

  ngOnInit() {
    // Get user ID from route parameters
    const userId = this.post.creator_id;
    this.currentUser = this.userService.currentUser;
    
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

  // Add these properties to your PostCardComponent class
  showEditPostForm = false;
  editPostText = '';

  // Toggle post edit form
  toggleEditPostForm(): void {
    this.showEditPostForm = !this.showEditPostForm;
    if (this.showEditPostForm) {
      // Initialize with current post content
      this.editPostText = this.post.Text;
    } else {
      this.editPostText = '';
    }
  }

  // Cancel post editing
  cancelEditPost(): void {
    this.showEditPostForm = false;
    this.editPostText = '';
  }

  // Edit post
  editPost(): void {
    if (!this.editPostText.trim() || this.editPostText === this.post.Text) {
      // If unchanged or empty, just close
      this.showEditPostForm = false;
      return;
    }
    
    this.postService.updatePost(this.post.id, this.editPostText).subscribe({
      next: (updatedPost) => {
        // Update the post content locally
        this.post.Text= updatedPost.Text;
        this.showEditPostForm = false;
        this.editPostText = '';
        
        // Show success message (optional)
        console.log('Post updated successfully');
        
        // Emit an event if parent needs to know
        // this.postUpdated.emit(this.post);
      },
      error: (error) => {
        console.error('Failed to update post:', error);
        // Show error message to user (optional)
      }
    });
  }

  // Delete post (you already have this, but update it)
  deletePost(): void {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }
    
    this.postService.deletePost(this.post.id).subscribe({
      next: (response) => {
        console.log('Post deleted:', response.message);
        // Emit the delete event so parent can remove it from list
        this.delete.emit(this.post.id);
      },
      error: (error) => {
        console.error('Failed to delete post:', error);
        // Show error message
      }
    });
  }

  /* ============================
     Comments
     ============================ */

  toggleReplyForm(comment: any): void {
    comment.showReplyForm = !comment.showReplyForm;
    if (!comment.showReplyForm) {
      this.replyText = '';
    }
  }

  addReply(comment: any): void {
    if (!this.replyText?.trim()) return;
    console.log(comment);
    this.postService.addComment(this.post.id, {
      text: this.replyText,
      in_reply_to: comment.id,
    }).subscribe({
      next: (reply) => {
        console.log(comment);
        console.log(reply);
        this.comments.unshift(reply);
        this.comments[0].user = this.userService.currentUser;
        this.resetAllSubmitButtons();
        // Reset the form
        comment.showReplyForm = false;
        this.replyText = '';
      }
    });
  }
  
  // In your PostCardComponent class, add these methods:

  // Toggle edit form visibility
  toggleEditForm(comment: any): void {
    comment.showEditForm = !comment.showEditForm;
    if (comment.showEditForm) {
      // Initialize editText with current comment text
      comment.editText = comment.text;
    } else {
      comment.editText = '';
    }
  }

  // Edit a comment
  editComment(comment: any): void {
    if (!comment.editText?.trim() || comment.editText === comment.text) {
      // If text is empty or unchanged, just close the form
      comment.showEditForm = false;
      return;
    }
    
    this.postService.updateComment(comment.id, comment.editText).subscribe({
      next: (updatedComment) => {
        // Update the comment text
        comment.text = updatedComment.text;
        comment.editText = '';
        comment.showEditForm = false;
        
        // Optional: Show success message
        console.log('Comment updated successfully');
      },
      error: (error) => {
        console.error('Failed to update comment:', error);
        // Optional: Show error message to user
      }
    });
  }

  // Delete a comment
  deleteComment(comment: any): void {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }
    
    this.postService.deleteComment(comment.id).subscribe({
      next: (response) => {
        // Remove the comment from the array
        const index = this.comments.findIndex(c => c.id === comment.id);
        if (index !== -1) {
          this.comments.splice(index, 1);
        }
        
        // Optional: Show success message
        console.log('Comment deleted successfully:', response.message);
      },
      error: (error) => {
        console.error('Failed to delete comment:', error);
        // Optional: Show error message to user
      }
    });
  }


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
              // We'll fetch the actual user when we fetch the comment author
            }
          }

          return enrichedComment;
        });

        // Now fetch users
        this.fetchUsersForComments();
        this.loadingComments = false;
      },
      error: () => {
        this.loadingComments = false;
      }
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
    //console.log(this.newComment);
    if (!this.newComment.trim()) return;
    
    this.postService.addComment(this.post.id, {
      text: this.newComment,
  }).subscribe({
      next: (comment) => {
        this.comments.unshift(comment);
        this.comments[0].user = this.userService.currentUser;
        this.comments[0].showReplyForm = false,
        this.newComment = '';
        this.resetAllSubmitButtons()
      }
    });
  }

  resetAllSubmitButtons(): void {
    const buttons = document.querySelectorAll('orang-button[type="submit"]');
    console.log(buttons)
    buttons.forEach(button => {
      (button as any).isActive=true;
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

  sharePost(): void {
    this.share.emit(this.post.id);
  }
}
