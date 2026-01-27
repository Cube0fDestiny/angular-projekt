export interface OrangNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: any | FriendRequestData | GroupJoinData | PostLikedData | PostCommentedData | ChatCreateData | MessageCreatedData;
  is_read: boolean;
  created_at: Date;
}

export interface NotificationList {
  notifications: OrangNotification[];
  total: Number;
  limit: Number;
  offset: Number;
}

export interface UnreadCount {
  unreadCount: Number;
}

export interface ApiResponse {
  message: string;
  data?: any;
}

export interface FriendRequestData {
  requesterId: string;
  requesterName?: string;
  requesterSurname?: string;
  requesterProfilePicture?: string;
}

export interface PostLikedData {
  postId: string;
  postOwnerId?: string; 
  userId: string;
  reactorName?: string;
  reactorSurname?: string;
  reactorProfilePicture?: string;
  reactionType: string;
}

export interface PostCommentedData {
  postId: string;
  commentId: string;
  creatorId: string;
  commenterName?: string;
  commenterSurname?: string;
  commenterProfilePicture?: string;
  commentText: string;
  postOwnerId?: string;
}

export interface GroupJoinData {
  groupId: string;
  groupName?: string;
  groupProfilePicture?: string;
  inviterId: string;
  invitedUserId?: string;
}

export interface ChatCreateData {
  chatId: string;
  chatName: string;
  creatorId: string;
  creatorName?: string;
  creatorSurname?: string;
  creatorProfilePicture?: string;
}

export interface MessageCreatedData {
  chatId: string;
  messageId: string;
  creatorId: string;
  senderName?: string;
  senderSurname?: string;
  senderProfilePicture?: string;
}

