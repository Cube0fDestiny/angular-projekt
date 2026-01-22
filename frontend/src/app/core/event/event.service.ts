// event.service.ts - Service implementation
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../../shared/models/user.model';
import {
  OrangEvent,
  UserEvent,
  EventFollower,
  CreateEventData,
  UpdateEventData,
  ApiResponse
} from '../../shared/models/event.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private readonly apiUrl = `${environment.apiUrl}/events`;

  constructor(private http: HttpClient) {}

  // 1. Get all events
  getAllEvents(): Observable<OrangEvent[]> {
    return this.http.get<OrangEvent[]>(`${this.apiUrl}/`);
  }

  // 2. Get event by ID
  getEventById(id: string): Observable<OrangEvent> {
    return this.http.get<OrangEvent>(`${this.apiUrl}/${id}`);
  }

  // 3. Get user's events (created and followed)
  getUserEvents(): Observable<UserEvent[]> {
    return this.http.get<UserEvent[]>(`${this.apiUrl}/user-events`);
  }

  // 4. Create new event
  createEvent(eventData: CreateEventData): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/`, eventData);
  }

  // 5. Update event
  updateEvent(id: string, eventData: UpdateEventData): Observable<OrangEvent> {
    return this.http.put<OrangEvent>(`${this.apiUrl}/${id}`, eventData);
  }

  // 6. Delete event (soft delete)
  deleteEvent(id: string): Observable<ApiResponse> {
    return this.http.delete<ApiResponse>(`${this.apiUrl}/${id}`);
  }

  // 7. Toggle event follow
  toggleFollowEvent(id: string): Observable<ApiResponse> {
    return this.http.post<ApiResponse>(`${this.apiUrl}/${id}/follow`, {});
  }

  // 8. Get event followers
  getEventFollowers(id: string): Observable<EventFollower[]> {
    return this.http.get<EventFollower[]>(`${this.apiUrl}/${id}/followers`);
  }
}