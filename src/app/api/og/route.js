import { ImageResponse } from '@vercel/og';

// MANTRA SAKTI: MESIN STEMPEL GAMBAR SULTRAFIKS
export const runtime = 'edge'; // Pakai runtime edge biar super cepat

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('imageUrl');

        if (!imageUrl) {
            return new Response("Missing imageUrl parameter", { status: 400 });
        }

        // 1. Ambil file gambar asli dari Supabase diam-diam di server
        const imageFetch = await fetch(imageUrl);
        const imageBuffer = await imageFetch.arrayBuffer();
        
        // Konversi ke format yang bisa dibaca mesin stempel
        const base64Image = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;

        // 2. Desain Stempel dan Gambar (Pakai React/JSX/CSS)
        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        position: 'relative',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#eee',
                        overflow: 'hidden',
                    }}
                >
                    {/* FOTO BERITA ASLI (FULL SCREEN) */}
                    <img
                        src={base64Image}
                        alt="News Image"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />

                    {/* 🔥 WATERMARK "sultra informasi" (POJOK KANAN BAWAH) 🔥 */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '10px', // Jarak dari bawah
                            right: '10px', // Jarak dari kanan
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(255, 255, 255, 0.7)', // Latar putih transparan (rekomendasi agar terlihat di semua foto)
                            padding: '6px 14px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 0, 0, 0.1)',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                        }}
                    >
                        <span
                            style={{
                                color: '#111827', // Warna tulisan hitam pekat
                                fontSize: '20px', // Ukuran tulisan watermark (sedang)
                                fontWeight: '900', // Font tebal (bold)
                                fontFamily: 'Inter, Arial, sans-serif',
                                textTransform: 'uppercase', // Huruf besar semua
                                letterSpacing: '0.05em',
                            }}
                        >
                            sultra informasi
                        </span>
                    </div>
                </div>
            ),
            {
                width: 1200, // Ukuran ideal Thumbnail WA/FB
                height: 630,
            }
        );
    } catch (e) {
        console.log(`${e.message}`);
        return new Response(`Failed to generate the image`, { status: 500 });
    }
}