import { sendRequest } from './api';

export const orderDetailsApi = {
  create: (data: any, accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/order-details`,
      method: 'POST',
      body: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  createMany: (data: any[], accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/order-details/batch`,
      method: 'POST',
      body: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  findByOrder: (orderId: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/order-details/order/${orderId}`,
      method: 'GET',
    }),

  getById: (id: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/order-details/${id}`,
      method: 'GET',
    }),

  update: (id: string, data: any, accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/order-details/${id}`,
      method: 'PATCH',
      body: data,
      headers: { Authorization: `Bearer ${accessToken}` },
    }),

  remove: (id: string, accessToken: string) =>
    sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/order-details/${id}`,
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
};

export default orderDetailsApi;
