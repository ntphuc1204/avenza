export const recommendationApi = {
  trackView: async (
    productId: string,
    accessToken?: string,
    timeSpentSeconds = 0,
  ) => {
    await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/${productId}/view`, {
      method: "POST",
    }).catch(() => null);

    if (!accessToken) return;

    return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/behavior/view`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ productId, timeSpentSeconds }),
    }).catch(() => null);
  },

  trackCart: (productId: string, accessToken?: string) => {
    if (!accessToken) return;

    return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/behavior/cart`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ productId }),
    }).catch(() => null);
  },

  trackSearch: (keyword: string, accessToken?: string) => {
    if (!accessToken || !keyword.trim()) return;

    return fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/behavior/search`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ keyword }),
    }).catch(() => null);
  },
};

export default recommendationApi;
