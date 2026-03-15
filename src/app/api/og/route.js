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
                <div
                    style={{
                        display: 'flex',
                        height: '100%',
                        width: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'column',
                        backgroundColor: '#fff',
                        position: 'relative',
                    }}
                >
                    {/* FOTO BERITA (Langsung tembak URL biar WA tidak ngambek nunggu lama) */}
                    <img
                        src={imageUrl}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                        }}
                    />

                    {/* EFEK GRADASI HITAM ELEGAN DI BAWAH (Biar tulisan selalu jelas) */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: '40%',
                            backgroundImage: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0))',
                        }}
                    />

                    {/* LOGO WATERMARK SULTRAFIKS DI POJOK KANAN BAWAH */}
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '30px',
                            right: '40px',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <span
                            style={{
                                color: '#ffffff',
                                fontSize: '42px',
                                fontWeight: '900',
                                fontFamily: 'sans-serif',
                                fontStyle: 'italic',
                                letterSpacing: '-1px',
                                textShadow: '2px 4px 6px rgba(0,0,0,0.5)'
                            }}
                        >
                            SULTRA<span style={{ color: '#3b82f6' }}>FIKS</span>
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