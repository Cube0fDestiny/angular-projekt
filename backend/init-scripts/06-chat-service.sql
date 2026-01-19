-- Chat Service Database Schema

CREATE TABLE IF NOT EXISTS "Chats" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    creator_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS "Chat_Participants" (
    chat_id UUID NOT NULL REFERENCES "Chats"(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS "Chat_Messages" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES "Chats"(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    deleted BOOLEAN DEFAULT false NOT NULL,
    creator_id UUID NOT NULL
);

CREATE TABLE IF NOT EXISTS "Chat_Message_Images" (
    message_id UUID NOT NULL,
    image_id UUID NOT NULL,
    image_order SMALLINT NOT NULL,
    PRIMARY KEY (message_id, image_id)
);

CREATE INDEX IF NOT EXISTS idx_messages_chat ON "Chat_Messages"(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_creator ON "Chat_Messages"(creator_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON "Chat_Participants"(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_deleted ON "Chat_Messages"(deleted);

-- Mock Data
INSERT INTO "Chats" (id, name, creator_id)
VALUES
  ('b50e8400-e29b-41d4-a716-446655440001', 'Development Team', '550e8400-e29b-41d4-a716-446655440001'),
  ('b50e8400-e29b-41d4-a716-446655440002', 'Project Planning', '550e8400-e29b-41d4-a716-446655440003'),
  ('b50e8400-e29b-41d4-a716-446655440003', 'Random Chat', '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO "Chat_Participants" (chat_id, user_id, joined_at)
VALUES
  ('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', now()),
  ('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', now()),
  ('b50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', now()),
  ('b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', now()),
  ('b50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', now()),
  ('b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', now()),
  ('b50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', now());

INSERT INTO "Chat_Messages" (id, chat_id, text, creator_id, deleted)
VALUES
  ('c50e8400-e29b-41d4-a716-446655440001', 'b50e8400-e29b-41d4-a716-446655440001', 'Hey team! How is the project going?', '550e8400-e29b-41d4-a716-446655440001', false),
  ('c50e8400-e29b-41d4-a716-446655440002', 'b50e8400-e29b-41d4-a716-446655440001', 'All good! Frontend is 80% complete.', '550e8400-e29b-41d4-a716-446655440003', false),
  ('c50e8400-e29b-41d4-a716-446655440003', 'b50e8400-e29b-41d4-a716-446655440001', 'Great! Backend APIs are ready for integration.', '550e8400-e29b-41d4-a716-446655440004', false),
  ('c50e8400-e29b-41d4-a716-446655440004', 'b50e8400-e29b-41d4-a716-446655440002', 'Let''s schedule a meeting for tomorrow', '550e8400-e29b-41d4-a716-446655440003', false),
  ('c50e8400-e29b-41d4-a716-446655440005', 'b50e8400-e29b-41d4-a716-446655440003', 'Hello everyone!', '550e8400-e29b-41d4-a716-446655440002', false),
  ('c50e8400-e29b-41d4-a716-446655440006', 'b50e8400-e29b-41d4-a716-446655440003', 'What''s everyone up to this weekend?', '550e8400-e29b-41d4-a716-446655440001', false);

INSERT INTO "Chat_Message_Images" (message_id, image_id, image_order)
VALUES
  ('c50e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 1),
  ('c50e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440002', 1);
