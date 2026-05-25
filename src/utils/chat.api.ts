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
