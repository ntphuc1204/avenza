import { sendRequest } from "./api";

// Get all banners
export const bannerApi = {
  getAll: (page: number = 1, pageSize: number = 10) => {
    return sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners`,
      method: "GET",
      queryParams: {
        page,
        limit: pageSize,
      },
    });
  },

  getAllActive: () => {
    return sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners/active`,
      method: "GET",
    });
  },

  getById: (id: string) => {
    return sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners/${id}`,
      method: "GET",
    });
  },

  create: (data: any, accessToken: string) => {
    return sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners`,
      method: "POST",
      body: data,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  update: (id: string, data: any, accessToken: string) => {
    return sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners/${id}`,
      method: "PATCH",
      body: data,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  delete: (id: string, accessToken: string) => {
    return sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners/${id}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  updateOrder: (id: string, order: number, accessToken: string) => {
    return sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners/${id}/order/${order}`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  },

  getByLocation: (location: string) => {
    return sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners/location/${location}`,
      method: "GET",
    });
  },
};
