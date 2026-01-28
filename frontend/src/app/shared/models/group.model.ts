// event.model.ts - Type definitions
export interface Group {
  id: string;
  name: string;
  bio: string;
  header_picture_id?: string;
  profile_picture_id?: string;
  created_at?: string;
  member_data: {
    members: number;
    owner_id: string;
  }
  profileImageUrl?: string; // This will hold the cached image URL
}

export interface GroupMember {
  user_id: string;
  name: string;
  surname: string;
  profile_picture_id?: string;
  profile_picture_url?: string;
  profile_header?: string;
  member_type: string;
}

export interface CreateGroupData {
  name: string;
  bio: string;
  header_picture_id?: string;
  profile_picture_id?: string;
  free_join: boolean;
}

export interface UpdateGroupData {
  name?: string;
  bio?: string;
  header_picture_id?: string;
  profile_picture_id?: string;
}

export interface ApiResponse {
  message: string;
  data?: any;
}

export interface ChangeUserMemberStatus {
  action: string;
  target_user: string;
  target_role?: string;
}

export interface GroupApplication {
  user_id: string;
  created_at: Date;
  group_id: string;
  valid: boolean;
  member_type: string;
  deleted: boolean;
}