import { sendRequest } from './api';

export const rolesApi = {
  getAll: () =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/roles`,
      method: 'GET',
    }),

  getById: (id: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/roles/${id}`,
      method: 'GET',
    }),

  create: (data: any, accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/roles`,
      method: 'POST',
      body: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  update: (id: string, data: any, accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/roles/${id}`,
      method: 'PATCH',
      body: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  remove: (id: string, accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/roles/${id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

export default rolesApi;
