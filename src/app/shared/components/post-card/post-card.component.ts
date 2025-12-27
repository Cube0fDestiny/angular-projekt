import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Post, Comment } from '../../models/post.model';
import { NgFor, NgIf } from '@angular/common';
@Component({
  selector: 'app-post-card',
  templateUrl: './post-card.component.html',
  imports: [NgIf,NgFor],
  styleUrls: ['./post-card.component.scss'], 
})
export class PostCardComponent {
  @Input() post!: Post;
  @Input() showActions = true;
  @Input() currentUserId?: number;
  
  @Output() like = new EventEmitter<number>();
  @Output() comment = new EventEmitter<{postId: number, text: string}>();
  @Output() share = new EventEmitter<number>();
  @Output() delete = new EventEmitter<number>();
  
  newComment = '';
  showComments = false;
  
  // Check if current user liked this post
  get isLikedByCurrentUser(): boolean {
    if (!this.currentUserId || !this.post.reactions) return false;
    return this.post.reactions.some(r => r.userId === this.currentUserId);
  }
  
  // Format time ago
  get timeAgo(): string {
    const now = new Date();
    const postDate = new Date(this.post.createdAt);
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
  
  onLike(): void {
    this.like.emit(this.post.id);
  }
  
  addComment(): void {
    if (this.newComment.trim()) {
      this.comment.emit({
        postId: this.post.id,
        text: this.newComment
      });
      this.newComment = '';
    }
  }
  
  toggleComments(): void {
    this.showComments = !this.showComments;
  }
  
  likeComment(commentId: number): void {
    console.log('Liked comment:', commentId);
  }
}