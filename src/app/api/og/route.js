import { ImageResponse } from '@vercel/og';

export const runtime = 'edge'; // Mode Super Cepat

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('imageUrl');

        if (!imageUrl) {
            return new Response("Missing imageUrl", { status: 400 });
        }

        return new ImageResponse(
            (
                <div style={{ display: 'flex', height: '100%', width: '100%', position: 'relative', backgroundColor: '#fff' }}>
                    {/* 1. Foto Asli Berita */}
                    <img 
                        src={imageUrl} 
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    
                    {/* 2. Gradasi Hitam di bawah agar tulisan SultraFiks selalu terbaca jelas */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.9))' }} />
                    
                    {/* 3. Teks Watermark SULTRAFIKS [GEN] di Pojok Kanan Bawah */}
                    <div style={{ position: 'absolute', bottom: '35px', right: '40px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#ffffff', fontSize: '48px', fontWeight: '900', fontFamily: 'sans-serif', fontStyle: 'italic', letterSpacing: '-1px', textShadow: '2px 4px 6px rgba(0,0,0,0.8)' }}>
                            SULTRA<span style={{ color: '#3b82f6' }}>FIKS</span> <span style={{ color: '#fbbf24', marginLeft: '12px' }}>[GEN]</span>
                        </span>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e) {
        return new Response(`Failed to generate image`, { status: 500 });
    }
}