import { Component } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/main/navbar.component';
import { User } from '../../shared/models/user.model';
import { UserService } from '../../core/user/user.service';
import { ChatService } from '../../core/chat/chat.service';
import { Chat, Message } from '../../shared/models/chat.model';
import { CommonModule, NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { OrangButtonComponent } from "../../shared/components/orang-button/orang-button.component";


@Component({
  selector: 'app-chat-main',
  imports: [NavbarComponent, CommonModule, NgIf, OrangButtonComponent, FormsModule],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent {
  
  currentUser!: User | null;
  isShowingChats = false;
  isShowingMessages = false;
  chats: Chat[] = [];
  messages: Message[] = [];
  activeChatId: string | null = null;
  newMessageText = '';

  private subscriptions: Subscription[] = [];

  constructor(
    public userService: UserService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Load chats
    this.subscriptions.push(
      this.chatService.chats$.subscribe(chats => {
        this.chats = chats;
      })
    );

    // Subscribe to messages for active chat
    this.subscriptions.push(
      this.chatService.messages$.subscribe(() => {
        if (this.activeChatId) {
          this.messages = this.chatService.getMessagesForChat(this.activeChatId);
        }
      })
    );

    // Subscribe to active chat changes
    this.subscriptions.push(
      this.chatService.activeChat$.subscribe(chatId => {
        this.activeChatId = chatId;
        if (chatId) {
          this.messages = this.chatService.getMessagesForChat(chatId);
        } else {
          this.messages = [];
        }
      })
    );

    // Initial load
    this.chatService.getChats().subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.disconnect();
  }

  selectChat(chatId: string): void {
    this.chatService.setActiveChat(chatId);
    this.isShowingMessages = true;
  }

  createMessage(): void {
    if (!this.activeChatId || !this.newMessageText.trim()) return;

    this.chatService.sendMessage(this.activeChatId, this.newMessageText).subscribe({
      next: () => {
        this.newMessageText = '';
        console.log('message sent!');
      },
      error: (error) => {
        console.error('Failed to send message:', error);
      }
    });
  }



}
