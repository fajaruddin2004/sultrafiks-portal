import { ImageResponse } from '@vercel/og';

// MANTRA SAKTI: MESIN STEMPEL TURBO EDGE (GEN) SULTRAFIKS
export const runtime = 'edge'; // Mode Super Cepat agar WA tidak Timeout

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('imageUrl');

        if (!imageUrl) {
            return new Response("Missing imageUrl", { status: 400 });
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
                    {/* 1. FOTO BERITA ASLI (FULL SCREEN) */}
                    <img
                        src={base64Image}
                        alt="News Image"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />

                    {/* 🔥 2. EFEK GRADASI HITAM MEWAH DI BAWAH (GRADIENT BLACK) 🔥 */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '40%', // Gradasi hitam menutupi 40% bagian bawah
                            backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))',
                        }}
                    />

                    {/* 🔥 3. WATERMARK BERCAHAYA "SULTRAFIKS [GEN]" (POJOK KANAN BAWAH) 🔥 */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '30px', // Jarak dari bawah
                            right: '40px', // Jarak dari kanan
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <span
                            style={{
                                color: '#ffffff', // Warna tulisan putih
                                fontSize: '42px', // Ukuran tulisan watermark (sedang)
                                fontWeight: '900', // Font tebal (bold)
                                fontFamily: 'sans-serif',
                                fontStyle: 'italic',
                                letterSpacing: '-1px',
                                textShadow: '2px 4px 6px rgba(0,0,0,0.5)' // Efek bayangan/cahaya halus
                            }}
                        >
                            SULTRA<span style={{ color: '#3b82f6' }}>FIKS</span> [GEN]
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