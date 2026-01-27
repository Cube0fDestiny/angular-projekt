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
import { Router } from '@angular/router';

@Component({
  selector: 'app-chat-main',
  imports: [NavbarComponent, CommonModule, FormsModule, OrangButtonComponent],
  templateUrl: './chat.component.html',
  styleUrl: './chat.component.css'
})
export class ChatComponent implements OnInit, OnDestroy {
  
  currentUser!: User | null;
  otherUser!: User | null;
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
    private chatHttpService: ChatHttpService,
    private router: Router
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

  selectChat(chat: Chat): void {
    console.log(chat);
    this.chatSocketService.changeCurrentChat(chat.id);
    this.activeChatId = chat.id;
    let participantIds = chat.participantsIds;
    let otherId = participantIds.filter(item => item !== this.currentUser!.id)[0];
    this.loadUser(otherId);
  }

  goToProfile(id: string): void {
    this.router.navigate(['/profile', id]);
  }

  formatChatName(name: string): string {
    let toRemove = `${this.currentUser!.name} ${this.currentUser!.surname}`;
    return name.replace(toRemove,'');
  }

  loadUser(userId: string): void {
    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.otherUser = user;
        console.log('loaded user: ', user);
        this.isShowingMessages = true;
      },
      error: (error) => {
        console.error('Failed to load user:', error);
      }
    });
  }
  
  deleteChat(chat: Chat): void {
    this.chatHttpService.deleteChat(chat.id).subscribe({
      next: () => {
        this.chats = this.chats.filter(item => item.id !== chat.id);
        if(chat.id===this.activeChatId){
          this.router.navigate(['/']).then(() => { this.router.navigate(['/chats']); });
        }
      }
    })
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
        if(chats.length>0){
          this.isShowingChats = true;
        }
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