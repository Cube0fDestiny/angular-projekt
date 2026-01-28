// src/app/core/posts/post.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post, Reaction, PostImage } from '../../shared/models/post.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly apiUrl = `${environment.apiUrl}/posts`;

  constructor(private http: HttpClient) {}

  /* ============================
     Public endpoints
     ============================ */

  getAllPosts(): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}`);
  }

  getPostById(id: string): Observable<Post> {
    return this.http.get<Post>(`${this.apiUrl}/${id}`);
  }

  getPostByLocationId(id: string): Observable<Post[]> {
    return this.http.get<Post[]>(`${this.apiUrl}/location/${id}`);
  }

  /* ============================
     Protected endpoints
     (JWT REQUIRED)
     ============================ */

  createPost(data: {
    content: string;
    location_id: string;
    location_type: string;
  }): Observable<Post> {
    return this.http.post<Post>(`${this.apiUrl}`, data);
  }

  updatePost(id: string, data: {content?: string, images?: PostImage[]}): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deletePost(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  /* ============================
     Comments
     ============================ */

  getComments(postId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${postId}/comments`);
  }

  addComment(postId: string, data: {
    text: string;
    in_reply_to?: string;
    image_ids?: string[];
  }): Observable<any> {
    console.log(data);
    console.log(postId);
    return this.http.post<any>(`${this.apiUrl}/${postId}/comments`, data);
  }

  updateComment(commentId: string, text: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/comments/${commentId}`, { text });
  }

  deleteComment(commentId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/comments/${commentId}`);
  }

  /* ============================
     Reactions
     ============================ */

  toggleReaction(postId: string): Observable<boolean> {
    return this.http.post<boolean>(`${this.apiUrl}/${postId}/reactions`, {});
  }
  getReaction(postId: string): Observable<Reaction> {
    return this.http.get<Reaction>(`${this.apiUrl}/${postId}/reactions`);
  }
}
