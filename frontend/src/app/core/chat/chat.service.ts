import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, tap } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { Chat, Message, SendMessageRequest, CreateChatRequest } from '../../shared/models/chat.model';
//import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = '/api/chats'; // Proxy through API gateway
  private socket?: Socket;
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  private messagesSubject = new BehaviorSubject<{ [chatId: string]: Message[] }>({});
  private activeChatSubject = new BehaviorSubject<string | null>(null);

  public chats$ = this.chatsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public activeChat$ = this.activeChatSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    this.socket = io('/api/chats');
    
    this.socket.on('connect', () => {
      console.log('Connected to chat socket');
    });

    this.socket.on('newMessage', (message: Message) => {
      this.handleNewMessage(message);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from chat socket');
    });
  }

  // Chat Management
  getChats(): Observable<Chat[]> {
    return this.http.get<Chat[]>(this.apiUrl).pipe(
      tap(chats => this.chatsSubject.next(chats)),
      catchError(error => {
        console.error('Error fetching chats:', error);
        throw error;
      })
    );
  }

  createChat(chatData: CreateChatRequest): Observable<Chat> {
    return this.http.post<Chat>(this.apiUrl, chatData).pipe(
      tap(newChat => {
        const currentChats = this.chatsSubject.value;
        this.chatsSubject.next([...currentChats, newChat]);
      }),
      catchError(error => {
        console.error('Error creating chat:', error);
        throw error;
      })
    );
  }

  // Message Management
  getMessages(chatId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.apiUrl}/${chatId}/messages`).pipe(
      tap(messages => {
        const currentMessages = this.messagesSubject.value;
        this.messagesSubject.next({
          ...currentMessages,
          [chatId]: messages
        });
      }),
      catchError(error => {
        console.error('Error fetching messages:', error);
        throw error;
      })
    );
  }

  sendMessage(chatId: string, text: string): Observable<Message> {
    return this.http.post<Message>(
      `${this.apiUrl}/${chatId}/messages`,
      { text }
    ).pipe(
      tap(message => {
        this.handleNewMessage(message);
      }),
      catchError(error => {
        console.error('Error sending message:', error);
        throw error;
      })
    );
  }

  sendMessageWithImages(chatId: string, text: string, images: File[]): Observable<Message> {
    const formData = new FormData();
    formData.append('text', text);
    
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    return this.http.post<Message>(
      `${this.apiUrl}/${chatId}/messages/with-images`,
      formData
    ).pipe(
      tap(message => {
        this.handleNewMessage(message);
      }),
      catchError(error => {
        console.error('Error sending message with images:', error);
        throw error;
      })
    );
  }

  // Real-time Message Handling
  private handleNewMessage(message: Message): void {
    const currentMessages = this.messagesSubject.value;
    const chatMessages = currentMessages[message.chat_id] || [];
    
    // Check if message already exists (avoid duplicates)
    if (!chatMessages.some(m => m.id === message.id)) {
      const updatedMessages = [...chatMessages, message];
      
      // Sort by created_at (newest last for better UX)
      updatedMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      this.messagesSubject.next({
        ...currentMessages,
        [message.chat_id]: updatedMessages
      });
    }
  }

  // Chat Selection
  setActiveChat(chatId: string | null): void {
    this.activeChatSubject.next(chatId);
    
    if (chatId) {
      // Load messages for the active chat if not already loaded
      const currentMessages = this.messagesSubject.value;
      if (!currentMessages[chatId]) {
        this.getMessages(chatId).subscribe();
      }
    }
  }

  // Helper Methods
  getMessagesForChat(chatId: string): Message[] {
    return this.messagesSubject.value[chatId] || [];
  }

  getActiveChatMessages(): Message[] {
    const activeChatId = this.activeChatSubject.value;
    return activeChatId ? this.getMessagesForChat(activeChatId) : [];
  }

  // Cleanup
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}