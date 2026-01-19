-- Group Service Database Schema

CREATE TYPE group_member_type AS ENUM ('banned', 'owner', 'admin', 'moderator', 'normal_member');

CREATE TABLE IF NOT EXISTS "Groups" (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    bio VARCHAR(255) NOT NULL,
    header_picture_id UUID,
    profile_picture_id UUID,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    deleted BOOLEAN DEFAULT false NOT NULL,
    free_join BOOLEAN DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "Group_Memberships" (
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    group_id UUID NOT NULL,
    valid BOOLEAN DEFAULT false NOT NULL,
    member_type group_member_type DEFAULT 'normal_member'::group_member_type NOT NULL,
    deleted BOOLEAN DEFAULT false NOT NULL,
    PRIMARY KEY (user_id, group_id)
);

CREATE INDEX IF NOT EXISTS idx_groups_creator ON "Groups"(created_at);
CREATE INDEX IF NOT EXISTS idx_groups_deleted ON "Groups"(deleted);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON "Group_Memberships"(user_id);

-- Mock Data
INSERT INTO "Groups" (id, name, bio, free_join, deleted)
VALUES
  ('a50e8400-e29b-41d4-a716-446655440001', 'Web Development Community', 'A group for web developers to share knowledge and collaborate', true, false),
  ('a50e8400-e29b-41d4-a716-446655440002', 'UI/UX Design Team', 'Discussing design trends and best practices', false, false),
  ('a50e8400-e29b-41d4-a716-446655440003', 'Data Science Club', 'Share data science projects and insights', true, false),
  ('a50e8400-e29b-41d4-a716-446655440004', 'Photography Enthusiasts', 'For photography lovers to share and discuss their work', true, false);

INSERT INTO "Group_Memberships" (group_id, user_id, member_type, valid, deleted)
VALUES
  ('a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'owner', true, false),
  ('a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'admin', true, false),
  ('a50e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'normal_member', true, false),
  ('a50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'owner', true, false),
  ('a50e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'normal_member', true, false),
  ('a50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', 'owner', true, false),
  ('a50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'moderator', true, false),
  ('a50e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'normal_member', true, false),
  ('a50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'owner', true, false),
  ('a50e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'normal_member', true, false);
