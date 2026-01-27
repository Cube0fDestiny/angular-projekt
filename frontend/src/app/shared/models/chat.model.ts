export interface Chat {
  id: string;
  name: string;
  creator_id: string;
  created_at: string;
  participantsIds: string[];
}

export interface Message {
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
