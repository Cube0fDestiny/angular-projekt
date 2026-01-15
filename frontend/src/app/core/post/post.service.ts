// src/app/core/posts/post.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Post } from '../../shared/models/post.model';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private readonly apiUrl = 'http://localhost:3000/posts';

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

  updatePost(id: string, content: string): Observable<Post> {
    return this.http.put<Post>(`${this.apiUrl}/${id}`, { content });
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

  toggleReaction(postId: string, reaction: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${postId}/reactions`, { reaction });
  }
}
