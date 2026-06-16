import { sendRequest } from './api';

export const chatApi = {
  sendMessage: (data: any, accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat`,
      method: 'POST',
      body: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  getMyMessages: (accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat/me`,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  getMyUnreadCount: (accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat/me/unread-count`,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  uploadImage: async (file: File, accessToken: string) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat/upload-image`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      },
    );

    const res = await response.json();

    if (!response.ok) {
      throw new Error(res?.message || 'Upload image failed');
    }

    return res;
  },

  getThreads: (accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat/threads`,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  getByUser: (userId: string, accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/chat/user/${userId}`,
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

export default chatApi;
