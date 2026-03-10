import { supabase } from '@/lib/supabase';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    try {
        const resolvedParams = await params;
        const slugParam = decodeURIComponent(resolvedParams.slug).toLowerCase();

        // 🔥 JURUS SNIPER: Ambil 4 kata pertama dari link untuk pencarian super cepat
        // Contoh link: "dua-mobil-dinas-pemprov..." -> Akan jadi "dua mobil dinas pemprov"
        const searchWords = slugParam.split('-').slice(0, 4).join(' ');

        // Server hanya menarik maksimal 5 berita yang judulnya mirip dengan 4 kata tadi
        const { data: searchResults, error } = await supabase
            .from('news')
            .select('title, content, image_url')
            .ilike('title', `%${searchWords}%`) // Cari yang mengandung kata tersebut
            .limit(5);

        if (error || !searchResults || searchResults.length === 0) {
            return { title: 'SultraFiks - Portal Berita Terkini' };
        }

        let article = null;
        
        // Pencocokan akhir agar tidak salah berita
        for (const item of searchResults) {
            if (item.title) {
                const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                if (itemSlug === slugParam) {
                    article = item;
                    break;
                }
            }
        }

        if (!article) {
            return { title: 'SultraFiks - Portal Berita Terkini' };
        }

        const baseUrl = 'https://www.sultrafiks.com';
        
        // Bersihkan teks dari kode HTML agar WA rapi
        const plainText = article.content 
            ? article.content.replace(/<[^>]+>/g, '').substring(0, 130) + '...' 
            : 'Baca selengkapnya di SultraFiks.';

        const imageUrl = article.image_url || `${baseUrl}/placeholder-news.jpg`;
        const articleUrl = `${baseUrl}/news/${slugParam}`;

        // 🔥 FORMAT WAJIB WHATSAPP 🔥
        return {
            title: article.title,
            description: plainText,
            openGraph: {
                title: article.title,
                description: plainText,
                url: articleUrl,
                siteName: 'SultraFiks',
                images: [
                    {
                        url: imageUrl,
                        secureUrl: imageUrl,
                        width: 1200,
                        height: 630,
                        alt: article.title,
                    }
                ],
                locale: 'id_ID',
                type: 'article',
            },
            twitter: {
                card: 'summary_large_image',
                title: article.title,
                description: plainText,
                images: [imageUrl],
            }
        };
    } catch (err) {
        return { title: 'SultraFiks - Berita Terkini' };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}