import { supabase } from '@/lib/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    const baseUrl = 'https://www.sultrafiks.com';
    
    // Pastikan Bos sudah upload "logo.png" ke folder public sesuai instruksi sebelumnya
    const fallbackImage = `${baseUrl}/logo.png`; 

    try {
        const resolvedParams = await params;
        if (!resolvedParams || !resolvedParams.slug) throw new Error("Slug kosong");

        const slugParam = decodeURIComponent(resolvedParams.slug).toLowerCase();
        
        // Judul darurat kalau database sedang sibuk
        const emergencyTitle = slugParam.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        // 🔥 JURUS SNIPER: Ambil 4 kata pertama dari URL untuk dicari ke Supabase 🔥
        // Contoh: "kakek-berusia-101-tahun"
        const searchWords = slugParam.split('-').slice(0, 4).join(' ');

        // Tarik HANYA berita yang judulnya mengandung kata "kakek berusia 101 tahun"
        const { data } = await supabase
            .from('news')
            .select('title, content, image_url')
            .ilike('title', `%${searchWords}%`)
            .limit(3);

        let article = null;
        if (data && data.length > 0) {
            // Cocokkan slug-nya agar presisi
            article = data.find(item => {
                if (!item.title) return false;
                const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return itemSlug === slugParam || slugParam.includes(itemSlug.substring(0, 30));
            });
            // Kalau meleset sedikit hurufnya, paksa ambil data hasil pencarian pertama
            if (!article) article = data[0];
        }

        // 🔥 JIKA BERITA KETEMU DI DATABASE 🔥
        if (article) {
            const cleanDesc = article.content 
                ? article.content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').substring(0, 130) + '...' 
                : 'Baca informasi selengkapnya di portal berita SultraFiks.';

            const finalImage = (article.image_url && article.image_url.startsWith('http')) 
                ? article.image_url 
                : fallbackImage;

            return {
                title: article.title,
                description: cleanDesc,
                openGraph: {
                    title: article.title,
                    description: cleanDesc,
                    url: `${baseUrl}/news/${slugParam}`,
                    siteName: 'SultraFiks',
                    images: [{ url: finalImage, width: 1200, height: 630, alt: article.title }],
                    type: 'article',
                },
                twitter: {
                    card: 'summary_large_image',
                    title: article.title,
                    images: [finalImage],
                }
            };
        }

        // 🔥 JIKA BERITA DIHAPUS DARI DATABASE 🔥
        // Teks "Berita Tidak Ditemukan" SUDAH DIMUSNAHKAN DARI KODINGAN INI!
        return {
            title: emergencyTitle,
            description: 'Baca informasi selengkapnya di SultraFiks, portal berita terdepan Sulawesi Tenggara.',
            openGraph: {
                title: emergencyTitle,
                description: 'Baca informasi selengkapnya di SultraFiks, portal berita terdepan Sulawesi Tenggara.',
                url: `${baseUrl}/news/${slugParam}`,
                images: [{ url: fallbackImage, width: 1200, height: 630 }],
                type: 'article',
            }
        };

    } catch (error) {
        // 🔥 JARING PENGAMAN TERAKHIR KALAU SERVER DOWN 🔥
        return {
            title: 'SultraFiks - Portal Berita Terkini',
            description: 'Media siber terdepan di Sulawesi Tenggara.',
            openGraph: {
                images: [{ url: fallbackImage, width: 1200, height: 630 }],
            }
        };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}