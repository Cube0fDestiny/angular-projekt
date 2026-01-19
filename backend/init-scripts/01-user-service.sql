-- User Service Database Schema

CREATE TABLE IF NOT EXISTS "Users" (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    name VARCHAR(255),
    surname VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    salt VARCHAR(255),
    profile_picture_id UUID,
    bio TEXT,
    profile_header UUID,
    is_company BOOLEAN,
    deleted BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS "Follows" (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    follower UUID NOT NULL REFERENCES "Users"(user_id) ON DELETE CASCADE,
    followee UUID NOT NULL REFERENCES "Users"(user_id) ON DELETE CASCADE,
    deleted BOOLEAN DEFAULT false,
    PRIMARY KEY (follower, followee)
);

CREATE TABLE IF NOT EXISTS "Friendships" (
    requester UUID NOT NULL REFERENCES "Users"(user_id) ON DELETE CASCADE,
    requestee UUID NOT NULL REFERENCES "Users"(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    active BOOLEAN DEFAULT false,
    deleted BOOLEAN DEFAULT false,
    PRIMARY KEY (requester, requestee)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower ON "Follows"(follower);
CREATE INDEX IF NOT EXISTS idx_follows_followee ON "Follows"(followee);
CREATE INDEX IF NOT EXISTS idx_follows_deleted ON "Follows"(deleted);
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON "Friendships"(requester);
CREATE INDEX IF NOT EXISTS idx_friendships_requestee ON "Friendships"(requestee);
CREATE INDEX IF NOT EXISTS idx_friendships_active ON "Friendships"(active);
CREATE INDEX IF NOT EXISTS idx_friendships_deleted ON "Friendships"(deleted);
CREATE INDEX IF NOT EXISTS idx_users_email ON "Users"(email);
CREATE INDEX IF NOT EXISTS idx_users_deleted ON "Users"(deleted);

-- Mock Data
INSERT INTO "Users" (user_id, name, surname, email, password, salt, bio, is_company, deleted)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'John', 'Doe', 'john@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'salt_1', 'Software engineer passionate about coding', false, false),
  ('550e8400-e29b-41d4-a716-446655440002', 'Jane', 'Smith', 'jane@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123457', 'salt_2', 'Designer and creative professional', false, false),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bob', 'Johnson', 'bob@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123458', 'salt_3', 'Product manager with 5 years experience', false, false),
  ('550e8400-e29b-41d4-a716-446655440004', 'Alice', 'Williams', 'alice@example.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123459', 'salt_4', 'Data scientist and ML enthusiast', false, false),
  ('550e8400-e29b-41d4-a716-446655440005', 'TechCorp', 'Inc', 'tech@company.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123460', 'salt_5', 'Leading technology company', true, false);

INSERT INTO "Follows" (follower, followee, deleted)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', false),
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', false),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', false),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', false),
  ('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', false);

INSERT INTO "Friendships" (requester, requestee, active, deleted)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', true, false),
  ('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', true, false),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', false, false);
