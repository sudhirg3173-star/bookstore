/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        // Book/standard cover images are static and never change in place —
        // a new upload gets a new file path/name. Cache optimized results for
        // 1 year to cut down on repeat transformations and cache writes.
        // See: https://vercel.com/docs/image-optimization/managing-image-optimization-costs
        minimumCacheTTL: 31536000, // 1 year (in seconds)
        // Only generate .webp output (skip avif) to halve the number of
        // transformed variants produced per source image (source files are
        // already .jpg/.webp/.png).
        formats: ["image/webp"],
    },
};

export default nextConfig;
