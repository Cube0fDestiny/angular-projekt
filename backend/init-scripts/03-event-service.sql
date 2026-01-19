-- Event Service Database Schema

CREATE TABLE IF NOT EXISTS "Events" (
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    bio VARCHAR(255) NOT NULL,
    header_picture_id UUID,
    profile_picture_id UUID,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    creator_id UUID NOT NULL,
    deleted BOOLEAN DEFAULT false NOT NULL
);

CREATE TABLE IF NOT EXISTS "Event_Follows" (
    user_id UUID NOT NULL,
    event_id UUID NOT NULL,
    date_created TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_events_creator ON "Events"(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_deleted ON "Events"(deleted);
CREATE INDEX IF NOT EXISTS idx_event_follows_user ON "Event_Follows"(user_id);

-- Mock Data
INSERT INTO "Events" (id, name, bio, creator_id, event_date, deleted)
VALUES
  ('950e8400-e29b-41d4-a716-446655440001', 'Tech Conference 2026', 'Annual gathering of tech innovators and professionals', '550e8400-e29b-41d4-a716-446655440001', '2026-03-15 09:00:00+00', false),
  ('950e8400-e29b-41d4-a716-446655440002', 'Web Development Workshop', 'Learn the latest web technologies and best practices', '550e8400-e29b-41d4-a716-446655440003', '2026-02-20 14:00:00+00', false),
  ('950e8400-e29b-41d4-a716-446655440003', 'Design Meetup', 'Connect with designers and share creative ideas', '550e8400-e29b-41d4-a716-446655440002', '2026-02-10 18:00:00+00', false),
  ('950e8400-e29b-41d4-a716-446655440004', 'AI & Machine Learning Summit', 'Explore cutting-edge AI applications and research', '550e8400-e29b-41d4-a716-446655440004', '2026-04-05 10:00:00+00', false);

INSERT INTO "Event_Follows" (user_id, event_id, date_created)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440001', now()),
  ('550e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440001', now()),
  ('550e8400-e29b-41d4-a716-446655440003', '950e8400-e29b-41d4-a716-446655440002', now()),
  ('550e8400-e29b-41d4-a716-446655440001', '950e8400-e29b-41d4-a716-446655440002', now()),
  ('550e8400-e29b-41d4-a716-446655440004', '950e8400-e29b-41d4-a716-446655440003', now()),
  ('550e8400-e29b-41d4-a716-446655440002', '950e8400-e29b-41d4-a716-446655440004', now());
