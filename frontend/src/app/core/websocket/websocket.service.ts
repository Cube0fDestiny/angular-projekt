// services/websocket.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
//import { environment } from '../../environments/environment';
import { ChatMessage } from '../../shared/models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private isConnected = new BehaviorSubject<boolean>(false);
  private newMessageSubject = new Subject<ChatMessage>();
  
  // Public observables
  public connectionStatus$ = this.isConnected.asObservable();
  public newMessage$ = this.newMessageSubject.asObservable();
  
  constructor() {
    this.initializeSocket();
  }
  
  private initializeSocket(): void {
    const token = localStorage.getItem('token');
    
    if (!token) {
      console.warn('No token found for WebSocket connection');
      return;
    }
    
    this.socket = io('/api/chats', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    });
    
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    if (!this.socket) return;
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
      this.isConnected.next(true);
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected.next(false);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnected.next(false);
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('WebSocket reconnected after', attemptNumber, 'attempts');
      this.isConnected.next(true);
    });
    
    // Handle new messages from server
    this.socket.on('newMessage', (message: ChatMessage) => {
      console.log('New message received via WebSocket:', message);
      this.newMessageSubject.next(message);
    });
    
    // Optional: Handle other events if needed
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }
  
  /**
   * Join a specific chat room
   */
  joinChat(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('joinChat', chatId);
      console.log(`Joined chat room: ${chatId}`);
    }
  }
  
  /**
   * Leave a specific chat room
   */
  leaveChat(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leaveChat', chatId);
      console.log(`Left chat room: ${chatId}`);
    }
  }
  
  /**
   * Send a message via WebSocket
   */
  sendMessageViaSocket(chatId: string, text: string): void {
    if (this.socket?.connected) {
      this.socket.emit('sendMessage', { chat_id: chatId, text });
    } else {
      console.error('Cannot send message: WebSocket not connected');
    }
  }
  
  /**
   * Manually reconnect WebSocket
   */
  reconnect(token?: string): void {
    if (token) {
      localStorage.setItem('token', token);
    }
    
    this.disconnect();
    this.initializeSocket();
  }
  
  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.next(false);
    }
  }
  
  /**
   * Check connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected.value;
  }
  
  /**
   * Get socket ID
   */
  getSocketId(): string | null {
    return this.socket?.id || null;
  }
  
  ngOnDestroy(): void {
    this.disconnect();
  }
}