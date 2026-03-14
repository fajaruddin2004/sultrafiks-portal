import { supabase } from '@/lib/supabase';

export default async function sitemap() {
    const baseUrl = 'https://www.sultrafiks.com';

    try {
        // Tarik data berita terbaru dari database (maksimal 1000 berita terbaru untuk peta)
        const { data: news } = await supabase
            .from('news')
            .select('title, created_at')
            .order('created_at', { ascending: false })
            .limit(1000);

        // Ubah format judul menjadi link (slug) yang ramah Google SEO
        const newsUrls = news?.map((item) => {
            const slug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return {
                url: `${baseUrl}/news/${slug}`,
                lastModified: new Date(item.created_at),
                changeFrequency: 'daily', // Beritahu Google bahwa ini bisa diupdate harian
                priority: 0.8, // Prioritas tinggi untuk berita
            };
        }) || [];

        // Gabungkan halaman utama (Home) dengan daftar link berita
        return [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: 'always', // Halaman utama sangat penting, selalu berubah!
                priority: 1.0, // Prioritas TERTINGGI (Raja)
            },
            ...newsUrls,
        ];
    } catch (error) {
        // Jika database sedang sibuk, tetap kirimkan peta halaman utama agar Google tidak marah
        return [
            {
                url: baseUrl,
                lastModified: new Date(),
                changeFrequency: 'always',
                priority: 1.0,
            }
        ];
    }
}