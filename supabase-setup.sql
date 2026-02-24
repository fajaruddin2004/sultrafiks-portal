-- ============================================
-- SETUP TABLES
-- ============================================

-- Table profiles (sudah ada biasanya, kalau belum bisa buat)
-- CREATE TABLE IF NOT EXISTS public.profiles (
--     id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
--     full_name TEXT,
--     username TEXT,
--     phone_number TEXT,
--     avatar_url TEXT,
--     role TEXT DEFAULT 'wartawan' CHECK (role IN ('wartawan', 'redaktur', 'admin')),
--     created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Table news (sudah ada biasanya)
-- CREATE TABLE IF NOT EXISTS public.news (
--     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     title TEXT NOT NULL,
--     content TEXT,
--     category TEXT DEFAULT 'Pemerintah',
--     image_url TEXT,
--     photo_source TEXT DEFAULT 'SultraFiks',
--     news_link TEXT,
--     photo_caption TEXT,
--     author_id UUID REFERENCES auth.users(id),
--     author_name TEXT,
--     status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'waiting_review', 'published', 'rejected')),
--     review_note TEXT,
--     is_headline BOOLEAN DEFAULT false,
--     views INTEGER DEFAULT 0,
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- ============================================
-- ENABLE RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- User dapat melihat semua profile
CREATE POLICY "Anyone can view profiles" ON public.profiles
FOR SELECT TO authenticated
USING (true);

-- User dapat insert profile sendiri
CREATE POLICY "Users can insert own profile" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

-- User dapat update profile sendiri
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- NEWS POLICIES
-- ============================================

-- Semua orang bisa melihat berita yang sudah published
CREATE POLICY "Public can view published news" ON public.news
FOR SELECT TO authenticated
USING (status = 'published');

-- Wartawan dapat insert berita
CREATE POLICY "Wartawan can insert news" ON public.news
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = author_id);

-- Wartawan dapat update berita miliknya
CREATE POLICY "Wartawan can update own news" ON public.news
FOR UPDATE TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Wartawan dapat delete berita miliknya
CREATE POLICY "Wartawan can delete own news" ON public.news
FOR DELETE TO authenticated
USING (auth.uid() = author_id);

-- Redaktur dapat update semua berita
CREATE POLICY "Redaktur can update all news" ON public.news
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'redaktur'
    )
);

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create bucket untuk gambar berita (kalau belum ada)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('berita', 'berita', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies untuk berita
-- CREATE POLICY "Public can view berita images" ON storage.objects
-- FOR SELECT USING (bucket_id = 'berita');

-- CREATE POLICY "Authenticated can upload berita images" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'berita' AND auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated can delete berita images" ON storage.objects
-- FOR DELETE USING (bucket_id = 'berita' AND auth.role() = 'authenticated');

-- ============================================
-- FUNGSI UNTUK TRIGGER AUTO CREATE PROFILE
-- ============================================

-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--     INSERT INTO public.profiles (id, full_name, role)
--     VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'wartawan');
--     RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
