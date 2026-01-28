import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Post, PostImage } from '../../models/post.model';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TextDisplayComponent } from '../../../shared/components/text-display/text-display.component';
import { OrangButtonComponent } from '../../../shared/components/orang-button/orang-button.component';
import { PostService } from '../../../core/post/post.service';
import { UserService } from '../../../core/user/user.service';
import { User } from '../../../shared/models/user.model';
import { ImageService } from '../../../core/image/image.service';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';

interface EnrichedComment {
  id: string;
  text: string;
  creator_id: string;
  created_at: string;
  in_reply_to?: string;
  displayDate?: string;
  showReplyForm?: boolean;
  showEditForm?: boolean;
  editText?: string;
  user?: User;
  parentUser?: User;
  isReply?: boolean;
}

@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  styleUrls: ['./post-card.component.scss'],
  standalone: true,
  imports: [NgIf, FormsModule, NgFor, TextDisplayComponent, OrangButtonComponent, ImageUploadComponent, OverlayModule, PortalModule],
})
export class PostCardComponent implements OnInit, OnDestroy {
  @Input() post!: Post;
  @Input() showActions = true;
  @Input() currentUserId?: string;
  
  /* Events */
  @Output() postDeleted = new EventEmitter<string>();
  @Output() like = new EventEmitter<string>();
  @Output() share = new EventEmitter<string>();

  

  /* User & State */
  currentUser: User | null = null;
  user: User | null = null;
  userReacted: boolean = false;
  isLoading = false;
  userProfilePicture = 'assets/logo_icon.png';

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
  comments: EnrichedComment[] = [];
  loadingComments = false;
  replyText = '';
  
  /* Edit Post State */
  showEditPostForm = false;
  editPostText = '';

  mainImage = 'assets/images/orange-grove.png';
  loadedMainImage = false;

  private subscriptions = new Subscription();

  constructor(
    private postService: PostService,
    private userService: UserService,
    private router: Router,
    private imageService: ImageService
  ) {}


  newImage: PostImage = {image_id: '', image_order: 0};
  changeMainImage(imageId: string):void {
    this.newImage.image_id = imageId;
    this.postService.updatePost(this.post.id, {images: [this.newImage]}).subscribe({
      next: (res) => {
        console.log('succesfully updated main iamge: ', res);
        this.loadMainImage();
      },
      error: (error) => {
        console.error('failed to update main image: ', error);
      }
    });
  }

  ngOnInit() {
    console.log(this.post);
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
    this.loadMainImage()
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadMainImage() {
    console.log('image: ', this.post.images?.[0]?.image_id);
    
    // Check if image_id EXISTS and is truthy
    if(this.post.images?.[0]?.image_id) {
      // This runs when we HAVE a valid image_id
      this.imageService.getImage(this.post.images[0].image_id).subscribe({
        next: (url) => {
          this.mainImage = url;
          this.loadedMainImage = true;
          console.log('loaded main image: ', url);
        },
        error: (error) => {
          console.error('failed to load main image: ', error);
          this.mainImage = 'assets/images/orange-grove.png';
          this.loadedMainImage = true;
        }
      });
    } else {
      // This runs when we DON'T have a valid image_id
      this.mainImage = 'assets/images/orange-grove.png';
      this.loadedMainImage = true;
    }
  }

  /* ============================
     User & Profile Pictures
     ============================ */

  loadUser(id: string): void {
    this.isLoading = true;
    const sub = this.userService.getUserById(id).pipe(
      switchMap(user => this.enrichUserWithProfilePicture(user))
    ).subscribe({
      next: (enrichedUser) => {
        this.user = enrichedUser;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load user:', error);
        this.user = { id } as User;
        this.isLoading = false;
      }
    });
    this.subscriptions.add(sub);
  }

  /**
   * Enriches a user object with their profile picture URL
   */
  private enrichUserWithProfilePicture(user: User) {
    if (!user.profile_picture_id) {
      user.profile_picture_url = 'assets/logo_icon.png';
      return of(user);
    }
    
    return this.imageService.getImage(user.profile_picture_id).pipe(
      map(url => {
        user.profile_picture_url = url;
        return user;
      }),
      catchError(() => {
        user.profile_picture_url = 'assets/logo_icon.png';
        return of(user);
      })
    );
  }

  /**
   * Enriches multiple users with profile pictures
   */
  private enrichUsersWithProfilePictures(userIds: string[]) {
    const uniqueIds = [...new Set(userIds)];
    
    const userObservables = uniqueIds.map(userId => 
      this.userService.getUserById(userId).pipe(
        switchMap(user => this.enrichUserWithProfilePicture(user)),
        catchError(() => {
          // Return a minimal user object if the request fails
          const fallbackUser: User = {
            id: userId,
            name: 'Unknown',
            surname: 'User',
            email: '',
            is_company: false,
            profile_picture_url: 'assets/logo_icon.png'
          };
          return of(fallbackUser);
        })
      )
    );

    return userObservables.length > 0 
      ? forkJoin(userObservables).pipe(
          map(users => {
            // Create a map for quick lookup
            const userMap = new Map<string, User>();
            users.forEach(user => userMap.set(user.id, user));
            return userMap;
          })
        )
      : of(new Map<string, User>());
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

  copyPostLink(postId: string): void {
    if (this.isCopying) return;
    
    this.isCopying = true;
    const url = `${window.location.origin}/post/${postId}`;

    navigator.clipboard.writeText(url).then(() => {
      this.copied = true;
      this.copyButtonText = '✅ Copied!';
      
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
    
    this.postService.updatePost(this.post.id, {content: this.editPostText}).subscribe({
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
     Comments Logic (REWRITTEN)
     ============================ */

  toggleComments(): void {
    this.showComments = !this.showComments;
    if (this.showComments && this.comments.length === 0) {
      this.loadComments();
    }
  }

  loadComments(): void {
    this.loadingComments = true;
    this.showComments = false;

    this.postService.getComments(this.post.id).pipe(
      switchMap(comments => {
        // First, collect all unique user IDs we need
        const userIds = new Set<string>();
        const parentUserIds = new Set<string>();
        
        const baseComments = comments.map(comment => {
          userIds.add(comment.creator_id);
          
          if (comment.in_reply_to) {
            const parentComment = comments.find(c => c.id === comment.in_reply_to);
            if (parentComment) {
              parentUserIds.add(parentComment.creator_id);
            }
          }
          
          return {
            ...comment,
            showReplyForm: false,
            showEditForm: false
          } as EnrichedComment;
        });

        // Combine all user IDs
        const allUserIds = [...userIds, ...parentUserIds];
        
        // Fetch all users with their profile pictures
        return this.enrichUsersWithProfilePictures([...allUserIds]).pipe(
          map(userMap => ({ baseComments, userMap }))
        );
      })
    ).subscribe({
      next: ({ baseComments, userMap }) => {
        // Enrich comments with user data
        this.comments = baseComments.map(comment => {
          const enrichedComment = { ...comment };
          
          // Add main user
          enrichedComment.user = userMap.get(comment.creator_id);
          
          // Add parent user if this is a reply
          if (comment.in_reply_to) {
            const parentComment = baseComments.find(c => c.id === comment.in_reply_to);
            if (parentComment) {
              enrichedComment.parentUser = userMap.get(parentComment.creator_id);
              enrichedComment.isReply = true;
            }
          }
          
          // Format display date
          enrichedComment.displayDate = this.formatTimeAgo(comment.created_at);
          
          return enrichedComment;
        });
        
        this.loadingComments = false;
        this.showComments = true;
      },
      error: (error) => {
        console.error('Failed to load comments:', error);
        this.loadingComments = false;
        this.showComments = true; // Show anyway even if profile pics failed
      }
    });
  }

  private formatTimeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  addComment(): void {
    if (!this.newComment.trim()) return;
    
    this.postService.addComment(this.post.id, {
      text: this.newComment,
    }).pipe(
      switchMap(comment => {
        return this.enrichUserWithProfilePicture(this.currentUser!).pipe(
          map(enrichedUser => ({ comment, user: enrichedUser }))
        );
      })
    ).subscribe({
      next: ({ comment, user }) => {
        const enrichedComment: EnrichedComment = {
          ...comment,
          user: user,
          showReplyForm: false,
          showEditForm: false,
          displayDate: 'Just now'
        };
        
        this.comments.unshift(enrichedComment);
        this.newComment = '';
        this.comment_count++;
      },
      error: (error) => {
        console.error('Failed to add comment:', error);
      }
    });
  }

  toggleReplyForm(comment: EnrichedComment): void {
    comment.showReplyForm = !comment.showReplyForm;
    if (!comment.showReplyForm) {
      this.replyText = '';
    }
  }

  addReply(parentComment: EnrichedComment): void {
    if (!this.replyText?.trim()) return;
    
    this.postService.addComment(this.post.id, {
      text: this.replyText,
      in_reply_to: parentComment.id,
    }).pipe(
      switchMap(comment => {
        return this.enrichUserWithProfilePicture(this.currentUser!).pipe(
          map(enrichedUser => ({ comment, user: enrichedUser }))
        );
      })
    ).subscribe({
      next: ({ comment, user }) => {
        const enrichedReply: EnrichedComment = {
          ...comment,
          user: user,
          parentUser: parentComment.user,
          isReply: true,
          showReplyForm: false,
          showEditForm: false,
          displayDate: 'Just now'
        };
        
        this.comments.unshift(enrichedReply);
        this.replyText = '';
        parentComment.showReplyForm = false;
        this.comment_count++;
      },
      error: (error) => {
        console.error('Failed to add reply:', error);
      }
    });
  }

  toggleEditForm(comment: EnrichedComment): void {
    comment.showEditForm = !comment.showEditForm;
    if (comment.showEditForm) {
      comment.editText = comment.text;
    } else {
      comment.editText = '';
    }
  }

  editComment(comment: EnrichedComment): void {
    if (!comment.editText?.trim() || comment.editText === comment.text) {
      comment.showEditForm = false;
      return;
    }
    
    this.postService.updateComment(comment.id, comment.editText).subscribe({
      next: (updatedComment) => {
        comment.text = updatedComment.text;
        comment.editText = '';
        comment.showEditForm = false;
        comment.displayDate = 'Just now';
        console.log('Comment updated successfully');
      },
      error: (error) => {
        console.error('Failed to update comment:', error);
      }
    });
  }

  deleteComment(comment: EnrichedComment): void {
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
        this.comment_count--;
      },
      error: (error) => {
        console.error('Failed to delete comment:', error);
      }
    });
  }

  resetAllSubmitButtons(): void {
    const buttons = document.querySelectorAll('orang-button[type="submit"]');
    buttons.forEach(button => {
      (button as any).isActive = true;
    });
  }
}