import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // secured.finance SDKがprocess.env.SF_ENVを参照するため、
  // NEXT_PUBLIC_SF_ENVの値をSF_ENVとしてブラウザに公開する
  env: {
    SF_ENV: process.env.NEXT_PUBLIC_SF_ENV || "staging",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
