import { NextResponse } from 'next/server';
import Groq from "groq-sdk";

// Inisialisasi Groq dengan API Key dari file .env
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export async function POST(req) {
    try {
        // Menerima data (pertanyaan + isi berita) dari frontend
        const { prompt, articleTitle, articleContent } = await req.json();

        // Mengirim instruksi ke otak Groq AI
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    // SYSTEM: Ini adalah "Karakter" AI-nya
                    role: "system",
                    content: `Kamu adalah asisten AI pintar dari portal berita SultraFiks. 
                    Tugasmu adalah merangkum dan menjawab pertanyaan pembaca secara spesifik berdasarkan isi berita berikut ini.
                    
                    Judul Berita: ${articleTitle}
                    Isi Berita: ${articleContent}
                    
                    Aturan menjawab:
                    1. Jawab dengan ramah, informatif, ringkas, dan gunakan bahasa Indonesia yang santai tapi sopan.
                    2. Selalu panggil pengguna dengan sebutan "Bos".
                    3. Jika pertanyaan pengguna TIDAK ADA hubungannya dengan isi berita di atas, tolak dengan sopan dan arahkan mereka untuk bertanya seputar topik berita saja.`
                },
                {
                    // USER: Ini adalah pertanyaan yang diketik pembaca
                    role: "user",
                    content: prompt
                }
            ],
            // 🔥 INI YANG KITA UBAH BOS: Memakai model terbaru Llama 3.1 yang lebih pintar dan super cepat 🔥
            model: "llama-3.1-8b-instant", 
            temperature: 0.7,
            max_tokens: 500,
        });

        // Mengirimkan balasan AI kembali ke frontend
        const aiResponse = completion.choices[0]?.message?.content || "Maaf Bos, AI sedang bingung nih.";
        return NextResponse.json({ text: aiResponse });

    } catch (error) {
        console.error("🔴 Bencana di Groq AI:", error);
        // Memastikan gelembung chat tidak kosong jika terjadi error server lagi
        return NextResponse.json(
            { text: "Waduh Bos, otak AI SultraFiks lagi gangguan sinyal nih. Coba tanya lagi ya!" }, 
            { status: 500 }
        );
    }
}