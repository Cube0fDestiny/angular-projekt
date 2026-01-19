-- Post Service Database Schema

CREATE TYPE reaction_type AS ENUM ('orang');

CREATE TABLE IF NOT EXISTS "Posts" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    Text VARCHAR(255),
    deleted BOOLEAN DEFAULT false,
    location_id UUID,
    location_type VARCHAR(255),
    creator_id UUID
);

CREATE TABLE IF NOT EXISTS "Post_Comments" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    in_reply_to UUID,
    text VARCHAR(255),
    image_ids UUID[],
    creator_id UUID,
    deleted BOOLEAN DEFAULT false,
    post_id UUID DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS "Post_Images" (
    post_id UUID NOT NULL,
    image_id UUID NOT NULL,
    image_order SMALLINT NOT NULL,
    PRIMARY KEY (post_id, image_id)
);

CREATE TABLE IF NOT EXISTS "Post_Reactions" (
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    reaction_type reaction_type,
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS "Comment_Images" (
    comment_id UUID NOT NULL,
    image_id UUID NOT NULL,
    image_order SMALLINT NOT NULL,
    PRIMARY KEY (comment_id, image_id)
);

CREATE TABLE IF NOT EXISTS "Comment_Reactions" (
    user_id UUID NOT NULL,
    comment_id UUID NOT NULL,
    reaction_type reaction_type,
    PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_posts_creator ON "Posts"(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON "Posts"(deleted);
CREATE INDEX IF NOT EXISTS idx_comments_post ON "Post_Comments"(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_creator ON "Post_Comments"(creator_id);
CREATE INDEX IF NOT EXISTS idx_comments_deleted ON "Post_Comments"(deleted);

-- Mock Data
INSERT INTO "Posts" (id, Text, creator_id, deleted)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Just launched my new project! Excited to share it with everyone.', '550e8400-e29b-41d4-a716-446655440001', false),
  ('650e8400-e29b-41d4-a716-446655440002', 'Beautiful sunset at the beach today 🌅', '550e8400-e29b-41d4-a716-446655440002', false),
  ('650e8400-e29b-41d4-a716-446655440003', 'Tips for productive remote work sessions', '550e8400-e29b-41d4-a716-446655440003', false),
  ('650e8400-e29b-41d4-a716-446655440004', 'Machine learning breakthrough in data analysis!', '550e8400-e29b-41d4-a716-446655440004', false);

INSERT INTO "Post_Comments" (id, post_id, text, creator_id, deleted)
VALUES
  ('750e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'This looks amazing! Congratulations on the launch.', '550e8400-e29b-41d4-a716-446655440002', false),
  ('750e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'Great work! Would love to see more details.', '550e8400-e29b-41d4-a716-446655440003', false),
  ('750e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', 'The colors are stunning!', '550e8400-e29b-41d4-a716-446655440001', false);

INSERT INTO "Post_Images" (post_id, image_id, image_order)
VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440001', 1),
  ('650e8400-e29b-41d4-a716-446655440001', '850e8400-e29b-41d4-a716-446655440002', 2),
  ('650e8400-e29b-41d4-a716-446655440002', '850e8400-e29b-41d4-a716-446655440003', 1),
  ('650e8400-e29b-41d4-a716-446655440004', '850e8400-e29b-41d4-a716-446655440004', 1);

INSERT INTO "Post_Reactions" (user_id, post_id, reaction_type)
VALUES
  ('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', 'orang'),
  ('550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440001', 'orang'),
  ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'orang'),
  ('550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440003', 'orang');

INSERT INTO "Comment_Reactions" (user_id, comment_id, reaction_type)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'orang'),
  ('550e8400-e29b-41d4-a716-446655440003', '750e8400-e29b-41d4-a716-446655440002', 'orang');
