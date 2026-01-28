export interface User {
  id: string;
  name: string;
  surname: string;
  email: string;
  bio?: string | null;
  is_company: boolean;
  created_at?: string;
  header_picture_id?: string;
  profile_picture_id?: string;
  profile_picture_url?: string;
  header_picture_url?: string;
}

export interface UserFollower {
  follower: string;
  username: string;
  avatar: string;
  profile_picture_url?: string;
}

export interface IncomingFriendRequest {
  from_user_id: string;
  created_at: Date;
}

export interface OutgoingFriendRequest {
  to_user_id: string;
  created_at: Date;
}

export interface FriendListItem {
  friend_id: string;
}

export interface ApiResponse {
  message: string;
  data?: any;
}
