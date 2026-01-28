// src/app/shared/models/post.model.ts

// Comment model
export interface Comment {
  id: string;
  created_at: Date;
  in_reply_to: string;
  text: string;
  image_ids: [string];
  creator_id: string;
  post_id: string;
}

// Reaction type
export interface Reaction {
  liked: boolean;
}

// MAIN POST MODEL
export interface Post {
  id: string;
  creator_id: string;
  Text: string;
  location_id: string;
  location_type: string;
  created_at: Date;
  deleted?: boolean;
  images?: PostImage[]; 
  orang_count: number;
  comment_count: number;
}

export interface PostImage {
  image_id: string;
  image_order: number;
}

// Types for creating/updating posts
export type CreatePostDto = {
  content: string;
  location_id: string;
  location_type: string;
};

export type CreateCommentDto = {
  text: string;
  in_reply_to?: string;
  image_ids: [string];
}

export type UpdatePostDto = Partial<CreatePostDto>;
export type UpdateCommentDto = Partial<CreateCommentDto>;