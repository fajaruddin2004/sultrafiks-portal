import { supabase } from '@/lib/supabase';

// Memaksa Next.js untuk membuat metadata ini di sisi server (Server-Side)
export async function generateMetadata({ params }) {
    // 1. Ambil slug dari URL
    const slugParam = decodeURIComponent(params.slug);
    
    // 2. Tarik data dari database (HARUS menggunakan await)
    const { data: allNews } = await supabase.from('news').select('title, content, image_url');
    
    let article = null;
    
    // 3. Cocokkan slug dengan judul berita di database
    if (allNews && allNews.length > 0) {
        article = allNews.find(item => {
            if(!item.title) return false;
            const itemSlug = item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            return itemSlug === slugParam;
        });
    }

    // 4. Jika berita tidak ditemukan, berikan metadata darurat
    if (!article) {
        return {
            title: 'Berita Tidak Ditemukan - SultraFiks',
            description: 'Portal Berita Terkini Sulawesi Tenggara',
        }
    }

    // 5. Potong teks untuk dijadikan deskripsi (max 150 huruf)
    const plainText = article.content 
        ? article.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...' 
        : 'Baca informasi selengkapnya hanya di SultraFiks, portal berita terdepan di Sulawesi Tenggara.';

    // 6. Susun Meta Tags Super Lengkap untuk WhatsApp, FB, dan IG
    const baseUrl = 'https://sultrafiks.com';
    const articleUrl = `${baseUrl}/news/${slugParam}`;
    const imageUrl = article.image_url || `${baseUrl}/placeholder-news.jpg`;

    return {
        title: `${article.title} - SultraFiks`,
        description: plainText,
        openGraph: {
            title: article.title,
            description: plainText,
            url: articleUrl,
            siteName: 'SultraFiks',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: article.title,
                },
            ],
            locale: 'id_ID',
            type: 'article',
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: plainText,
            images: [imageUrl],
        },
        // Tambahan khusus untuk WhatsApp agar lebih responsif membaca gambar
        alternates: {
            canonical: articleUrl,
        }
    }
}

export default function NewsLayout({ children }) {
    return <>{children}</>;
}