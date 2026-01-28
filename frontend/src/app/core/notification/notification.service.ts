// src/app/core/notification/notification.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { OrangNotification, NotificationList, UnreadCount, ApiResponse } from '../../shared/models/notification.model';
import { environment } from '../../../environments/environment';
import { io, Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  allowedTypes = ['post.commented', 'friend.request', 'post.liked', 'group.invited', 'chat.created', 'message.created'];
  constructor(private http: HttpClient) {}

  getAllNotofications(limit: Number = 30, offset: Number = 0):Observable<NotificationList>{
    return this.http.get<NotificationList>(`${this.apiUrl}?limit=${limit}&offset=${offset}`);
  }

  getUnreadCount():Observable<UnreadCount>{
    return this.http.get<UnreadCount>(`${this.apiUrl}/unread-count`);
  }

  readNotification(notificationId: string):Observable<ApiResponse>{
    return this.http.patch<ApiResponse>(`${this.apiUrl}/:${notificationId}/read`, {});
  }

  readAllNotifications():Observable<ApiResponse>{
    return this.http.patch<ApiResponse>(`${this.apiUrl}/read-all`, {});
  }

  deleteNotification(notificationId: string):Observable<ApiResponse>{
    if(this.isInitialized){
      const currentNotifications = this.notificationsSubject.value;
      const updatedNotifications = currentNotifications.filter(
        notification => notification.id !== notificationId
      );
      this.notificationsSubject.next(updatedNotifications);
    }
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${notificationId}`);
  }

  deleteAllNotofications():Observable<ApiResponse>{
    return this.http.delete<ApiResponse>(`${this.apiUrl}`);
  }
  private isInitialized = false;
  private socket?: Socket;
  private notificationsSubject = new BehaviorSubject<OrangNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  initializeSocket(): void {
    if (this.isInitialized && this.socket?.connected) {
      console.log('Socket already initialized');
      return;
    }
    const token = localStorage.getItem('token');

    this.socket = io(`${environment.apiUrl}`, {
      path: '/api/notifications/socket',
      auth: { token },
      extraHeaders: {
      Authorization: `Bearer ${token}`
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to notification socket');
      this.isInitialized = true;
      this.loadNotifications();
    });

    this.socket.on('newNotification', (notification: OrangNotification) => {
      console.log('new notification: ', notification);
      console.log(notification);
      this.addNotification(notification);
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

  addNotification(notification: OrangNotification): void {
    // If allowedTypes is provided and not empty, filter by type
    if (this.allowedTypes.length > 0 && !this.allowedTypes.includes(notification.type)) {
      console.log(`Notification type "${notification.type}" not in allowed types: [${this.allowedTypes.join(', ')}]`);
      return;
    }
    
    const currentNotifications = this.notificationsSubject.value;
    if (!currentNotifications.some(n => n.id === notification.id)) {
      const updatedNotifications = [...currentNotifications, notification];
      updatedNotifications.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      this.notificationsSubject.next(updatedNotifications);
    }
  }

  loadNotifications(): void {
    this.getAllNotofications().subscribe({
      next: (rawList) => {
        let filteredNotifications = rawList.notifications;
        
        // Filter by allowed types if provided
        if (this.allowedTypes.length > 0) {
          filteredNotifications = rawList.notifications.filter(
            notification => this.allowedTypes.includes(notification.type)
          );
          console.log(`Loaded ${filteredNotifications.length} notifications after filtering (from ${rawList.total} total)`);
        } else {
          console.log('Loaded notifications', rawList.total);
        }
        
        this.notificationsSubject.next(filteredNotifications);
      },
      error: (error) => {
        console.error('Failed to load notifications:', error);
      }
    });
  }

  clearNotifications(): void {
    this.notificationsSubject.next([]);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = undefined;
    }
    this.clearNotifications();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

}