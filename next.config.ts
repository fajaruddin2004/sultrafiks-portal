/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co', // Mengizinkan giling gambar dari database
      },
      {
        protocol: 'https',
        hostname: 'www.sultrafiks.com', // Mengizinkan giling gambar dari website sendiri
      },
    ],
  },
};

export default nextConfig;