// services/chat.service.ts
import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, mergeMap, map, forkJoin } from 'rxjs';
//import { environment } from '../../environments/environment';
import {
  Chat,
  ChatMessage,
  CreateChatRequest,
  SendMessageRequest,
  SendMessageWithImagesRequest,
  ChatParticipant
} from '../../shared/models/chat.model';
import { WebSocketService } from '../websocket/websocket.service';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private readonly apiUrl = '/api/chats';
  
  // State management
  private chats = new BehaviorSubject<Chat[]>([]);
  private activeChat = new BehaviorSubject<Chat | null>(null);
  private chatMessages = new Map<string, BehaviorSubject<ChatMessage[]>>();
  private chatParticipants = new Map<string, BehaviorSubject<ChatParticipant[]>>();
  
  // Public observables
  public chats$ = this.chats.asObservable();
  public activeChat$ = this.activeChat.asObservable();
  public isConnected$: Observable<boolean>;
  
  // Subscriptions
  private subscriptions = new Subscription();
  
  constructor(
    private http: HttpClient,
    private webSocketService: WebSocketService,
    private userService: UserService
  ) {
    this.isConnected$ = this.webSocketService.connectionStatus$;
    this.setupWebSocketListeners();
    this.loadChats();
  }
  
  /**
   * Set up WebSocket listeners
   */
  private setupWebSocketListeners(): void {
    // Listen for new messages via WebSocket
    this.subscriptions.add(
      this.webSocketService.newMessage$.subscribe(message => {
        this.handleNewMessage(message);
      })
    );
    
    // Listen for connection status changes
    this.subscriptions.add(
      this.webSocketService.connectionStatus$.subscribe(isConnected => {
        if (isConnected && this.activeChat.value) {
          this.webSocketService.joinChat(this.activeChat.value.id);
        }
      })
    );
  }
  
  /**
   * Handle incoming WebSocket messages
   */
  private handleNewMessage(message: ChatMessage): void {
    const chatId = message.chat_id;
    
    // Get or create message subject for this chat
    let messagesSubject = this.chatMessages.get(chatId);
    if (!messagesSubject) {
      messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
      this.chatMessages.set(chatId, messagesSubject);
    }
    
    // Add new message to the chat
    const currentMessages = messagesSubject.value;
    
    // Check if message already exists (prevent duplicates)
    if (!currentMessages.some(m => m.id === message.id)) {
      const updatedMessages = [...currentMessages, message];
      // Sort by creation date (oldest first)
      updatedMessages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      messagesSubject.next(updatedMessages);
    }
  }
  
  /**
   * Get all chats for the current user
   */
  loadChats(): void {
    this.http.get<Chat[]>(`${this.apiUrl}/`).subscribe({
      next: (chats) => {
        this.chats.next(chats);
      },
      error: (error) => {
        console.error('Error loading chats:', error);
      }
    });
  }
  
  /**
   * Get chats observable
   */
  getChats(): Observable<Chat[]> {
    return this.chats$;
  }
  
  /**
   * Create a new chat
   */
  createChat(chatData: CreateChatRequest): Observable<Chat> {
    return this.http.post<Chat>(`${this.apiUrl}/`, chatData).pipe(
      mergeMap(newChat => {
        // Update local chats list
        const currentChats = this.chats.value;
        this.chats.next([...currentChats, newChat]);
        return [newChat];
      })
    );
  }
  
  /**
   * Get messages for a specific chat
   */
  getChatMessages(chatId: string): Observable<ChatMessage[]> {
    return this.http.get<ChatMessage[]>(`${this.apiUrl}/${chatId}/messages`).pipe(
      map(messages => {
        // Sort messages by date (oldest first)
        return messages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }),
      mergeMap(messages => {
        // Store messages locally
        let messagesSubject = this.chatMessages.get(chatId);
        if (!messagesSubject) {
          messagesSubject = new BehaviorSubject<ChatMessage[]>(messages);
          this.chatMessages.set(chatId, messagesSubject);
        } else {
          messagesSubject.next(messages);
        }
        
        return messagesSubject.asObservable();
      })
    );
  }
  
  /**
   * Get messages observable for a specific chat
   */
  getChatMessagesObservable(chatId: string): Observable<ChatMessage[]> {
    let messagesSubject = this.chatMessages.get(chatId);
    if (!messagesSubject) {
      messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
      this.chatMessages.set(chatId, messagesSubject);
      this.loadChatMessages(chatId);
    }
    return messagesSubject.asObservable();
  }
  
  /**
   * Load messages for a chat
   */
  private loadChatMessages(chatId: string): void {
    this.http.get<ChatMessage[]>(`${this.apiUrl}/${chatId}/messages`).subscribe({
      next: (messages) => {
        const messagesSubject = this.chatMessages.get(chatId);
        if (messagesSubject) {
          messagesSubject.next(messages);
        }
      },
      error: (error) => {
        console.error(`Error loading messages for chat ${chatId}:`, error);
      }
    });
  }
  
  /**
   * Send a text message
   */
  sendMessage(chatId: string, text: string): Observable<ChatMessage> {
    const messageData: SendMessageRequest = { text };
    
    // Send via WebSocket for real-time
    this.webSocketService.sendMessageViaSocket(chatId, text);
    
    // Also send via HTTP for persistence and response
    return this.http.post<ChatMessage>(`${this.apiUrl}/${chatId}/messages`, messageData);
  }
  
  /**
   * Send a message with images
   */
  sendMessageWithImages(chatId: string, data: SendMessageWithImagesRequest): Observable<ChatMessage> {
    const formData = new FormData();
    
    // Add text
    formData.append('text', data.text);
    
    // Add existing image IDs if provided
    if (data.existingImageIds && data.existingImageIds.length > 0) {
      formData.append('images', JSON.stringify(data.existingImageIds));
    }
    
    // Add image files if provided
    if (data.images && data.images.length > 0) {
      data.images.forEach((file, index) => {
        formData.append('images', file, file.name);
      });
    }
    
    // Note: Using gateway URL for image uploads
    const gatewayUrl = '/api';
    
    return this.http.post<ChatMessage>(
      `${gatewayUrl}/chats/${chatId}/messages/with-images`,
      formData
    );
  }
  
  /**
   * Set active chat
   */
  setActiveChat(chat: Chat): void {
    // Leave previous chat room
    const previousChat = this.activeChat.value;
    if (previousChat && previousChat.id !== chat.id) {
      this.webSocketService.leaveChat(previousChat.id);
    }
    
    // Set new active chat
    this.activeChat.next(chat);
    
    // Join WebSocket room for this chat
    if (this.webSocketService.getConnectionStatus()) {
      this.webSocketService.joinChat(chat.id);
    }
    
    // Load messages if not already loaded
    this.getChatMessagesObservable(chat.id);
  }
  
  /**
   * Clear active chat
   */
  clearActiveChat(): void {
    const currentChat = this.activeChat.value;
    if (currentChat) {
      this.webSocketService.leaveChat(currentChat.id);
    }
    this.activeChat.next(null);
  }
  
  /**
   * Get active chat
   */
  getActiveChat(): Chat | null {
    return this.activeChat.value;
  }
  
  /**
   * Get participants for a chat (you may need to implement this based on your backend)
   */
  getChatParticipants(chatId: string): Observable<ChatParticipant[]> {
    // This would depend on your backend implementation
    // For now, return an empty array or implement based on your needs
    let participantsSubject = this.chatParticipants.get(chatId);
    if (!participantsSubject) {
      participantsSubject = new BehaviorSubject<ChatParticipant[]>([]);
      this.chatParticipants.set(chatId, participantsSubject);
    }
    return participantsSubject.asObservable();
  }
  
  /**
   * Load chat participants (example - you'll need to adjust based on your API)
   */
  loadChatParticipants(chatId: string): void {
    // Example: If you have an endpoint to get chat participants
    // this.http.get<ChatParticipant[]>(`${this.apiUrl}/${chatId}/participants`).subscribe({
    //   next: (participants) => {
    //     const subject = this.chatParticipants.get(chatId);
    //     if (subject) {
    //       subject.next(participants);
    //     }
    //   }
    // });
  }
  
  /**
   * Delete a chat (if your API supports it)
   */
  deleteChat(chatId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${chatId}`).pipe(
      mergeMap(() => {
        // Remove from local state
        const currentChats = this.chats.value.filter(chat => chat.id !== chatId);
        this.chats.next(currentChats);
        
        // Clear active chat if it was deleted
        if (this.activeChat.value?.id === chatId) {
          this.clearActiveChat();
        }
        
        return [true];
      })
    );
  }
  
  /**
   * Get chat by ID
   */
  getChatById(chatId: string): Observable<Chat> {
    return this.http.get<Chat>(`${this.apiUrl}/${chatId}`);
  }
  
  /**
   * Load user details for messages
   */
  loadUserDetailsForMessages(messages: ChatMessage[]): Observable<(ChatMessage & { creatorName?: string })[]> {
    // Extract unique creator IDs
    const creatorIds = [...new Set(messages.map(m => m.creator_id))];
    
    // Fetch user details for each creator
    const userObservables = creatorIds.map(id => 
      this.userService.getUserById(id)
    );
    
    return forkJoin(userObservables).pipe(
      map(users => {
        const userMap = new Map(users.map(user => [user.id, user]));
        
        // Enhance messages with creator names
        return messages.map(message => ({
          ...message,
          creatorName: userMap.get(message.creator_id)?.name
        }));
      })
    );
  }
  
  /**
   * Clean up
   */
  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.webSocketService.disconnect();
  }
}