import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { User } from '../../shared/models/user.model';
import { UserService } from '../../core/user/user.service';
import { ChatSocketService } from '../../core/chat/chat-socket.service';
import { ChatHttpService } from '../../core/chat/chat-http.service';
import { Chat, Message } from '../../shared/models/chat.model';
import { CommonModule } from '@angular/common';
import { Subscription, combineLatest } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { OrangButtonComponent } from "../../shared/components/orang-button/orang-button.component";

@Component({
  selector: 'app-chat-main',
  imports: [NavbarComponent, CommonModule, FormsModule, OrangButtonComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  
  currentUser!: User | null;
  isShowingChats = false;
  isShowingMessages = false;
  chats: Chat[] = [];
  messages: Message[] = [];
  activeChatId: string | null = null;
  activeChatName: string = '';
  newMessageText = '';

  private subscriptions: Subscription[] = [];

  constructor(
    public userService: UserService,
    private chatSocketService: ChatSocketService,
    private chatHttpService: ChatHttpService
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Initialize socket connection
    this.chatSocketService.initializeSocket();
    
    this.subscriptions.push(
      this.chatSocketService.messages$.subscribe(allMessages => {
        // If we have an active chat, get its messages
        this.messages = allMessages;
      })
    );

    // Load all chats
    this.loadAllChats();
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatSocketService.disconnect();
  }

  selectChat(chatId: string): void {
    this.chatSocketService.changeCurrentChat(chatId);
    this.activeChatId = chatId;
    this.isShowingMessages = true;
  }

  createMessage(): void {
    if (!this.newMessageText.trim()) return;

    this.chatHttpService.sendMessage(this.activeChatId!, this.newMessageText).subscribe({
      next: () => {
        this.newMessageText = '';
        console.log('Message sent!');
      },
      error: (error) => {
        console.error('Failed to send message:', error);
      }
    });
  }

  loadAllChats(): void {
    this.chatHttpService.getChats().subscribe({
      next: (chats) => {
        this.chats = chats;
        console.log('Loaded chats:', chats);
        this.isShowingChats = true;
      },
      error: (error) => {
        console.error('Failed to load chats:', error);
      }
    });
  }

  // Helper methods
  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}