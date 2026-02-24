import { AuthProvider } from "@/context/AuthContext";
import { NewsProvider } from "@/context/NewsContext";
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AuthProvider>
          <NewsProvider>
            {children}
          </NewsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
