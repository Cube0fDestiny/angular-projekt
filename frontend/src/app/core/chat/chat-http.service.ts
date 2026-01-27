// chat-http.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { Chat, Message, CreateChatRequest } from '../../shared/models/chat.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../shared/models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ChatHttpService {
  private apiUrl = `${environment.apiUrl}/chats`;

  constructor(private http: HttpClient) {}

  // Chat Management
  getChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(this.apiUrl).pipe(
      catchError(error => {
        console.error('Error fetching chats:', error);
        throw error;
      })
    );
  }

  createChat(chatData: CreateChatRequest): Observable<Chat> {
    return this.http.post<Chat>(this.apiUrl, chatData).pipe(
      catchError(error => {
        console.error('Error creating chat:', error);
        throw error;
      })
    );
  }

  // Message Management (HTTP only)
  getMessages(chatId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${chatId}/messages`).pipe(
      catchError(error => {
        console.error('Error fetching messages:', error);
        throw error;
      })
    );
  }

  deleteChat(chatId: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${chatId}`).pipe(
      catchError(error => {
        console.error('Error deleting chat:', error);
        throw error;
      })
    );
  }

  sendMessage(chatId: string, text: string): Observable<Message> {
    return this.http.post<Message>(
      `${this.apiUrl}/${chatId}/messages`,
      { text }
    ).pipe(
      catchError(error => {
        console.error('Error sending message:', error);
        throw error;
      })
    );
  }

  sendMessageWithImages(chatId: string, text: string, images: File[]): Observable<Message> {
    const formData = new FormData();
    formData.append('text', text);
    
    images.forEach((image) => {
      formData.append('images', image);
    });

    return this.http.post<Message>(
      `${this.apiUrl}/${chatId}/messages/with-images`,
      formData
    ).pipe(
      catchError(error => {
        console.error('Error sending message with images:', error);
        throw error;
      })
    );
  }
}