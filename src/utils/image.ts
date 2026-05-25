export const normalizeImageUrl = (url?: string) => {
  if (!url) return url || "";
  try {
    if (/^https?:\/\//i.test(url) || /^blob:\/\//i.test(url)) return url;
    if (url.startsWith("/")) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}${url}`;
    }
    // some upload endpoints return { url: '/uploads/..' } or filename only
    // map filename-only to the media uploads folder
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/media/${url}`;
  } catch (e) {
    return url;
  }
};
