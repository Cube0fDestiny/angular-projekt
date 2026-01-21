// models/chat.model.ts
export interface Chat {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  creator_id: string;
  text: string;
  created_at: string;
  images?: Array<{
    image_id: string;
    image_order: number;
  }>;
}

export interface CreateChatRequest {
  name: string;
  participantIds: string[];
}

export interface SendMessageRequest {
  text: string;
}

export interface SendMessageWithImagesRequest {
  text: string;
  images?: File[]; // For new file uploads
  existingImageIds?: Array<{ image_id: string; image_order: number }>; // For existing images
}

export interface RabbitMQChatEvent {
  chatId: string;
  name: string;
  creatorId: string;
  participants: string[];
  timestamp: string;
}

export interface RabbitMQMessageEvent {
  messageId: string;
  chatId: string;
  creatorId: string;
  text: string;
  timestamp: string;
}

export interface ChatParticipant {
  id: string;
  name?: string;
  email?: string;
  // Add other user fields as needed
}