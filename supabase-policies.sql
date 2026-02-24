-- Copy dan paste kode ini ke Supabase SQL Editor

-- Allow authenticated users to insert news
CREATE POLICY "Allow insert news for authenticated users"
ON public.news
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to select news
CREATE POLICY "Allow select news for authenticated users"
ON public.news
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to update news
CREATE POLICY "Allow update news for authenticated users"
ON public.news
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete news
CREATE POLICY "Allow delete news for authenticated users"
ON public.news
FOR DELETE
TO authenticated
USING (true);
