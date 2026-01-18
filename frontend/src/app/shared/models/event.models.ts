// event.model.ts - Type definitions
export interface OrangEvent {
  id: string;
  name: string;
  bio: string;
  event_date: string | Date;
  creator_id: string;
  header_picture_id?: string;
  profile_picture_id?: string;
  created_at?: string;
  updated_at?: string;
  deleted?: boolean;
}

export interface UserEvent extends OrangEvent {
  user_relation: 'created' | 'followed';
}

export interface EventFollower {
  user_id: string;
  name: string;
  surname: string;
  profile_picture_id?: string;
  is_company: boolean;
}

export interface CreateEventData {
  name: string;
  bio: string;
  event_date: string; // ISO 8601 timestamp
  header_picture_id?: string;
  profile_picture_id?: string;
}

export interface UpdateEventData {
  name?: string;
  bio?: string;
  event_date?: string; // ISO 8601 timestamp
}

export interface ApiResponse {
  message: string;
  data?: any;
}

export interface EventStats {
  event_id: string;
  followers_count: number;
  attendees_count: number;
  days_until_event: number;
}