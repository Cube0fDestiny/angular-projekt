// src/app/shared/models/post.model.ts

// First, you might need the User model:
export interface User {
  id: number;
  name: string;
  avatar: string;
  email?: string;
  role?: 'user' | 'admin' | 'moderator';
  status?: 'online' | 'away' | 'offline';
  bio?: string;
  friends?: number[]; // Array of friend IDs
}

// Comment model
export interface Comment {
  id: number;
  text: string;
  author: User;
  createdAt: Date;
  likes: number;
  replies?: Comment[]; // Nested comments for replies
}

// Reaction type
export interface Reaction {
  userId: number;
  type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry';
}

// MAIN POST MODEL
export interface Post {
  id: number;
  content: string;
  author: User;
  createdAt: Date;
  updatedAt?: Date;
  
  // Engagement stats
  likes: number;
  reactions?: Reaction[]; // Detailed reactions
  comments: Comment[];
  shares: number;
  
  // Media
  imageUrl?: string;
  videoUrl?: string;
  
  // Metadata
  location?: string;
  tags?: string[];
  isEdited?: boolean;
  isPinned?: boolean;
  
  // Privacy
  //visibility: 'public' | 'friends' | 'private';
  
  // User interaction
  userReaction?: Reaction['type']; // Current user's reaction
  isLiked?: boolean; // For quick check
  isShared?: boolean;
}

// Types for creating/updating posts
export type CreatePostDto = {
  content: string;
  image?: File;
  video?: File;
  location?: string;
  tags?: string[];
 // visibility?: Post['visibility'];
};

export type UpdatePostDto = Partial<CreatePostDto>;