-- 1. Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Books (Metadata only, we don't sync the massive text files)
CREATE TABLE books (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_hash text NOT NULL,
  file_name text NOT NULL,
  total_pages integer,
  word_count integer,
  parsed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, file_hash)
);

-- 3. Reading Progress
CREATE TABLE reading_progress (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_hash text NOT NULL,
  file_name text NOT NULL,
  current_page integer,
  total_pages integer,
  percent integer,
  word_count integer,
  last_read_at timestamp with time zone,
  UNIQUE(user_id, file_hash)
);

-- 4. Annotations (Bookmarks, Highlights, Notes)
CREATE TABLE annotations (
  id text PRIMARY KEY, -- We use string IDs from IndexedDB (or cast numbers to strings)
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_hash text NOT NULL,
  type text NOT NULL, -- 'bookmark', 'highlight', 'note'
  page_number integer NOT NULL,
  text_content text, -- Highlight text or Note content or Bookmark label
  color text, -- Highlight color
  start_offset integer,
  end_offset integer,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- 5. Vocabulary
CREATE TABLE vocabulary (
  id text PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  word text NOT NULL,
  definition text,
  phonetic text,
  part_of_speech text,
  context_sentence text,
  page_number integer,
  book_name text,
  mastered boolean DEFAULT false,
  date_added timestamp with time zone
);

-- 6. Row Level Security (RLS) policies
-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

-- Create policies so users can only see and edit their own data
CREATE POLICY "Users can manage their own books" ON books FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own progress" ON reading_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own annotations" ON annotations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own vocabulary" ON vocabulary FOR ALL USING (auth.uid() = user_id);

-- 7. Storage Bucket configuration for raw physical books
-- (You must run this in the Supabase SQL editor to allow users to upload/download PDFs)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('books', 'books', false)
ON CONFLICT (id) DO NOTHING;

-- Safely drop existing policies just in case they were misconfigured
DROP POLICY IF EXISTS "Users can upload their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can download their own books" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own books" ON storage.objects;

-- Enable RLS for the books bucket so only logged in users can upload/download
CREATE POLICY "Users can upload books"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can download books"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'books');

CREATE POLICY "Users can delete books"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);

