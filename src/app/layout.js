import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { NewsProvider } from "@/context/NewsContext";

export const metadata = {
  title: "SultraFiks - Portal Berita",
  description: "Portal Berita Terkini Sulawesi Tenggara",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      {/* Warna dasar diletakkan di sini agar Dark Mode berfungsi sempurna */}
      <body className="bg-white dark:bg-[#0B0F19] text-slate-900 dark:text-white transition-colors duration-300">
        
        {/* INI DIA GUDANG DATANYA BOS! WAJIB MENGAPIT {children} */}
        <AuthProvider>
          <NewsProvider>
            {children}
          </NewsProvider>
        </AuthProvider>

      </body>
    </html>
  );
}