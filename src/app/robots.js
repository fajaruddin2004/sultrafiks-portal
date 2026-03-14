export default function robots() {
    return {
        rules: {
            userAgent: '*', // Mengundang SEMUA robot mesin pencari (Google, Bing, Yahoo, dll)
            allow: '/',     // Bebas merayapi halaman utama dan halaman berita
            disallow: ['/admin/', '/super/', '/api/'], // DILARANG KERAS masuk ke halaman rahasia dapur!
        },
        // Beri tahu robot di mana letak peta otomatis yang kita buat tadi
        sitemap: 'https://www.sultrafiks.com/sitemap.xml', 
    };
}