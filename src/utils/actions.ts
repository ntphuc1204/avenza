'use server'

import { auth, signIn } from "@/auth";
import { revalidateTag } from 'next/cache'
import { sendRequest, sendRequestFile } from "./api";


export async function authenticate(username: string, password: string) {
    try {
        const r = await signIn("credentials", {
            username: username,
            password: password,
            // callbackUrl: "/",
            redirect: false,
        })
        console.log(">>> check r: ", r)
        return r;
    } catch (error) {
        if ((error as any).name === "InvalidEmailPasswordError") {
            return {
                error: (error as any).type,
                code: 1
            }

        } else if ((error as any).name === "InactiveAccountError") {
            return {
                error: (error as any).type,
                code: 2
            }
        } else {
            return {
                error: "Internal server error",
                code: 0
            }
        }

    }
}

const buildFormData = (data: any) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (value instanceof File) {
            formData.append(key, value);
        } else if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
            formData.append(key, value[0]);
        } else {
            formData.append(key, String(value));
        }
    });
    return formData;
}

const uploadImage = async (image: File) => {
    const session = await auth();

    const formData = new FormData();

    formData.append('image', image);

    console.log("UPLOAD FILE:", image);

    const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/upload-image`,
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${session?.user?.access_token}`,
            },
            body: formData,
        }
    );

    const res = await response.json();

    console.log("UPLOAD RESPONSE:", res);

    if (!response.ok) {
        throw new Error(res?.message || 'Upload ảnh thất bại');
    }

    if (!res?.data?.image) {
        throw new Error('Không nhận được image url');
    }

    return res.data.image;
}

export const handleCreateUserAction = async (data: any) => {
    const session = await auth();

    const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: data,
    });

    revalidateTag('list-users');

    return res;
}

    export const handleUpdateUserAction = async (data: any) => {
        const session = await auth();

        const res = await sendRequest({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users`,
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${session?.user?.access_token}`,
            },
            body: data, // chỉ plain object
        });

        revalidateTag('list-users');
        return res;
    };
    export const handleDeleteUserAction = async (
        id: string,
    ) => {
    const session = await auth();
    const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/${id}`,
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    })

    revalidateTag("list-users")
    return res;
}
export const handleCreateProductAction = async (data: any) => {
  const session = await auth();

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`,
    method: "POST",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    body: data,
  });

  revalidateTag("list-products");

  return res;
};
export const handleUpdateProductAction = async (data: any) => {
    const session = await auth();

    const payload: any = { ...data };

    // upload nhiều ảnh nếu có
    if (payload.images && Array.isArray(payload.images)) {
        payload.images = await Promise.all(
            payload.images.map(async (item: any) => {
                // already a URL string
                if (typeof item === 'string') return item;

                // direct File from input
                if (item instanceof File) {
                    return await uploadImage(item);
                }

                // Antd Upload file object: originFileObj is the File
                if (item?.originFileObj instanceof File) {
                    return await uploadImage(item.originFileObj);
                }

                // Uploaded item may contain url or response data
                if (item?.url) return item.url;

                if (item?.response?.data?.image) return item.response.data.image;

                // fallback: stringify (but backend expects string URLs)
                return String(item);
            })
        );
    }

    const res: any = await sendRequest({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/${payload._id}`,
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: payload,
    });

    revalidateTag('list-products');
    return res;
};
export const handleDeleteProductAction = async (id: string) => {
    const session = await auth();

    const res: any = await sendRequest({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/${id}`,
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
        },
    });

    revalidateTag("list-products");
    return res;
};