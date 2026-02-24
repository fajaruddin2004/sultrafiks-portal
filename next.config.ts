import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'wtfxxqxcogspzdtwamrq.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Paksa abaikan optimasi gambar untuk menghindari error IP privat di terminal Bos
    unoptimized: true,
  },
};

export default nextConfig;