// chat-socket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Message } from '../../shared/models/chat.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatSocketService implements OnDestroy {
  private socket?: Socket;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private currentChatId = '';
  public messages$ = this.messagesSubject.asObservable();
  private isInitialized = false;
  private apiUrl = `${environment.apiUrl}/chats`;

  constructor(private http: HttpClient) {}

  // Initialize socket connection (call this only when needed)
  initializeSocket(): void {
    if (this.isInitialized && this.socket?.connected) {
      console.log('Socket already initialized');
      return;
    }
    const token = localStorage.getItem('token');
    
    // 1. Extract the origin (e.g., http://localhost:3000) to avoid Namespace errors
    const urlObj = new URL(environment.apiUrl);
    const socketUrl = urlObj.origin;

    this.socket = io(socketUrl, {
      path: '/api/chats/socket', // Keep this path so Gateway routing works
      auth: { token },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      },
      // Optional: Force WebSocket to avoid polling issues if proxying is tricky
      transports: ['websocket', 'polling'] 
    });
    
    this.socket.on('connect', () => {
      console.log('Connected to chat socket');
      this.isInitialized = true;
    });

    this.socket.on('newMessage', (message: Message) => {
      // Only add message if it belongs to the current chat
      console.log(message);
      this.addMessage(message);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat socket');
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket connect_error:', err.message);
    });

    this.socket.on('error', (err) => {
      console.error('Socket error:', err);
    });
  }

  addMessage(message: Message): void {
    const currentMessages = this.messagesSubject.value;
    
    // Check if message already exists (avoid duplicates)
    if (!currentMessages.some(m => m.id === message.id)) {
      const updatedMessages = [...currentMessages, message];
      
      // Sort by created_at (newest last for better UX)
      updatedMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      this.messagesSubject.next(updatedMessages);
    }
  }

  loadMessages(chatId: string): void {
    this.http.get<Message[]>(`${this.apiUrl}/${chatId}/messages`).subscribe({
      next: (messages) => {
        this.messagesSubject.next(messages);
        console.log('loaded messages');
      },
      error: (error) => {
        console.error('Failed to load messages:', error);
      }
    });
  }

  changeCurrentChat(chatId: string):void {
    this.currentChatId = chatId;
    this.loadMessages(chatId);
    if (this.socket?.connected) {
      this.socket.emit('joinChatRoom', chatId);
    }
  }

  // Get current messages
  getMessages(): Message[] {
    return this.messagesSubject.value;
  }

  // Clear messages (when switching chats)
  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
    this.clearMessages();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}