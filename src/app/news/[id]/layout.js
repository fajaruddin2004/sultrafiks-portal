import { supabase } from '@/lib/supabase';

// 🔥 INI RAHASIANYA: WAJIB ADA AGAR WHATSAPP PERCAYA SAMA WEBSITE KITA 🔥
export const metadataBase = new URL('https://www.sultrafiks.com');
export const revalidate = 0; 
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
    try {
        const resolvedParams = await params;
        const slugParam = decodeURIComponent(resolvedParams.slug).toLowerCase();

        // Tarik data database dengan aman
        const { data: allNews } = await supabase
            .from('news')
            .select('title, content, image_url')
            .order('created_at', { ascending: false });

        let article = null;
        
        // Pencarian super presisi
        if (allNews && allNews.length > 0) {
            article = allNews.find(item => {
                if (!item.title) return false;
                const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                return itemSlug === slugParam;
            });
        }

        // Jika Gagal / Berita Dihapus
        if (!article) {
            return {
                title: 'SultraFiks - Portal Berita Terkini',
                description: 'Baca berita terupdate seputar Sulawesi Tenggara.',
                openGraph: {
                    images: ['/placeholder-news.jpg']
                }
            };
        }

        // Pembersihan Teks (Hapus enter dan kode HTML agar WA rapi seperti KendariInfo)
        const plainText = article.content 
            ? article.content.replace(/<[^>]+>/g, '').replace(/\n/g, ' ').substring(0, 140) + '...' 
            : 'Baca selengkapnya di portal berita terpercaya SultraFiks.';

        // Format URL Gambar
        const imageUrl = article.image_url && article.image_url.startsWith('http') 
            ? article.image_url 
            : '/placeholder-news.jpg';

        // 🔥 STRUKTUR OPENGRAPH KHUSUS WHATSAPP & FACEBOOK 🔥
        return {
            title: article.title,
            description: plainText,
            openGraph: {
                title: article.title,
                description: plainText,
                url: `/news/${slugParam}`,
                siteName: 'SultraFiks',
                images: [
                    {
                        url: imageUrl, // Vercel akan otomatis menggabung dengan metadataBase
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
        return { title: 'SultraFiks - Berita Terkini Sulawesi Tenggara' };
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}