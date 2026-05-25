export const uploadUserImage = async (
  file: File,
  accessToken: string
) => {
  const formData = new FormData();

  formData.append("image", file);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/users/upload-image`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  const res = await response.json();

  return res;
};
export const uploadProductImages = async (
  files: File[],
  accessToken: string
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/upload-images`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  const res = await response.json();

  if (!response.ok) {
    throw new Error(res?.message || "Upload product images failed");
  }

  return res;
};

export const uploadMediaImages = async (
  files: File[],
  accessToken: string
) => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/uploads/images`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    }
  );

  const res = await response.json();

  if (!response.ok) {
    throw new Error(res?.message || "Upload banner image failed");
  }

  return res;
};