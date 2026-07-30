/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // Book/standard cover images are static, already-optimized local
        // files (.jpg/.webp) served from /public/images. Routing them
        // through Vercel's on-the-fly Image Optimization API (/_next/image)
        // burns transformation quota for no benefit and can 402 once the
        // free/included quota is exhausted. `unoptimized: true` makes
        // next/image render a plain <img> pointing straight at the source
        // file — no transformations, no optimization-cache usage, while
        // still keeping next/image's lazy-loading/layout-shift behavior.
        // See: https://vercel.com/docs/image-optimization/managing-image-optimization-costs
        unoptimized: true,
        // NOTE: minimumCacheTTL/formats below only take effect if
        // `unoptimized` is removed and optimization is re-enabled later.
        minimumCacheTTL: 31536000, // 1 year (in seconds)
        formats: ["image/webp"],
    },
};

export default nextConfig;
