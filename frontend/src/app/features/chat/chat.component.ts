import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, HostListener } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { User } from '../../shared/models/user.model';
import { UserService } from '../../core/user/user.service';
import { ChatSocketService } from '../../core/chat/chat-socket.service';
import { ChatHttpService } from '../../core/chat/chat-http.service';
import { Chat, Message } from '../../shared/models/chat.model';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat-main',
  standalone: true,
  imports: [NavbarComponent, CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  
  currentUser: User | null = null;
  otherUser: User | null = null;
  isShowingChats = false;
  isShowingMessages = false;
  chats: Chat[] = [];
  messages: Message[] = [];
  activeChatId: string | null = null;
  activeChatName = '';
  newMessageText = '';
  isTyping = false;
  isMobileView = false;
  isInitialized = false;
  
  private subscriptions: Subscription[] = [];
  private shouldScrollToBottom = false;
  private readonly MOBILE_BREAKPOINT = 1024;

  constructor(
    public userService: UserService,
    private chatSocketService: ChatSocketService,
    private chatHttpService: ChatHttpService,
    private router: Router
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.isInitialized = true;
    }, 0);

    this.subscriptions.push(
      this.userService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );

    this.chatSocketService.initializeSocket();
    
    // Subscribe to messages and sort them
    this.subscriptions.push(
      this.chatSocketService.messages$.subscribe(allMessages => {
        // Sort messages by created_at in ascending order (oldest first, newest last)
        this.messages = this.sortMessagesByDate(allMessages);
        this.shouldScrollToBottom = true;
      })
    );

    this.loadAllChats();
  }

  /**
   * Sort messages by created_at timestamp in ascending order
   * Oldest messages first, newest messages last (at bottom of chat)
   */
  private sortMessagesByDate(messages: Message[]): Message[] {
    if (!messages || messages.length === 0) return [];
    
    return [...messages].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateA - dateB; // Ascending order (oldest first)
    });
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  private checkScreenSize(): void {
    if (typeof window !== 'undefined') {
      this.isMobileView = window.innerWidth < this.MOBILE_BREAKPOINT;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatSocketService.disconnect();
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
          });
        }, 50);
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  /**
   * Scroll to bottom immediately without animation (for initial load)
   */
  private scrollToBottomInstant(): void {
    try {
      if (this.messagesContainer) {
        const element = this.messagesContainer.nativeElement;
        setTimeout(() => {
          element.scrollTop = element.scrollHeight;
        }, 50);
      }
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  selectChat(chat: Chat): void {
    this.chatSocketService.changeCurrentChat(chat.id);
    this.activeChatId = chat.id;
    
    const participantIds = chat.participantsIds;
    const otherId = participantIds.find(id => id !== this.currentUser?.id);
    
    if (otherId) {
      this.loadUser(otherId);
    }
  }

  goBackToChats(): void {
    this.isShowingMessages = false;
    this.activeChatId = null;
    this.otherUser = null;
    this.messages = [];
  }

  goToProfile(id: string): void {
    this.router.navigate(['/profile', id]);
  }

  formatChatName(name: string): string {
    if (!this.currentUser) return name;
    const toRemove = `${this.currentUser.name} ${this.currentUser.surname}`;
    return name.replace(toRemove, '').trim();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  loadUser(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.otherUser = user;
        this.isShowingMessages = true;
        this.shouldScrollToBottom = true;
        // Scroll instantly on initial load
        setTimeout(() => this.scrollToBottomInstant(), 100);
      },
      error: (error) => {
        console.error('Failed to load user:', error);
      }
    });
  }
  
  deleteChat(chat: Chat): void {
    const confirmMessage = this.isMobileView 
      ? 'Delete this chat?' 
      : 'Are you sure you want to delete this chat? This action cannot be undone.';
    
    if (!confirm(confirmMessage)) return;
    
    this.chatHttpService.deleteChat(chat.id).subscribe({
      next: () => {
        this.chats = this.chats.filter(item => item.id !== chat.id);
        
        if (this.chats.length === 0) {
          this.isShowingChats = false;
        }
        
        if (chat.id === this.activeChatId) {
          this.activeChatId = null;
          this.isShowingMessages = false;
          this.otherUser = null;
          this.messages = [];
        }
      },
      error: (error) => {
        console.error('Failed to delete chat:', error);
      }
    });
  }

  createMessage(): void {
    if (!this.newMessageText.trim() || !this.activeChatId) return;

    const messageText = this.newMessageText.trim();
    this.newMessageText = '';

    this.chatHttpService.sendMessage(this.activeChatId, messageText).subscribe({
      next: () => {
        this.shouldScrollToBottom = true;
      },
      error: (error) => {
        console.error('Failed to send message:', error);
        this.newMessageText = messageText;
      }
    });
  }

  loadAllChats(): void {
    this.chatHttpService.getChats().subscribe({
      next: (chats) => {
        this.chats = chats;
        this.isShowingChats = chats.length > 0;
      },
      error: (error) => {
        console.error('Failed to load chats:', error);
      }
    });
  }

  formatTime(timestamp: string): string {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatMessageDate(timestamp: string): string {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  }

  shouldShowDateSeparator(message: Message, index: number): boolean {
    if (index === 0) return true;
    if (!message.created_at || !this.messages[index - 1]?.created_at) return false;
    
    const currentDate = new Date(message.created_at).toDateString();
    const previousDate = new Date(this.messages[index - 1].created_at).toDateString();
    
    return currentDate !== previousDate;
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id || index.toString();
  }

  trackByChatId(index: number, chat: Chat): string {
    return chat.id || index.toString();
  }
}