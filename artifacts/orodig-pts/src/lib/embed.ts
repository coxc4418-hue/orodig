/** Build an embeddable URL for YouTube, Vimeo, or direct HLS/MP4 links. */
export function getStreamEmbedUrl(streamUrl: string | null | undefined): string | null {
  if (!streamUrl?.trim()) return null;
  const url = streamUrl.trim();

  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
  }

  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  }

  if (/\.(m3u8|mp4|webm)(\?|$)/i.test(url) || url.startsWith("https://")) {
    return url;
  }

  return null;
}
