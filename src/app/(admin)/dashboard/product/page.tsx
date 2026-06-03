import { auth } from "@/auth";

import ProductTable from "@/components/admin/product/product.table";

import { sendRequest } from "@/utils/api";

interface IProps {
  params: { id: string };

  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

const ManageProductPage = async (props: IProps) => {
  const current = props?.searchParams?.current ?? 1;

  const pageSize = props?.searchParams?.pageSize ?? 10;

  const search = props?.searchParams?.search ?? "";

  const session = await auth();
  console.log(session);

  // danh sách sản phẩm
  const queryObj: Record<string, any> = {
    status: "ALL",
  };

  if (search) {
    queryObj.search = search;
  }

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`,

    method: "GET",

    queryParams: {
      current,
      pageSize,
      query: JSON.stringify(queryObj),
    },

    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },

    nextOption: {
      next: {
        tags: ["list-products"],
      },
    },
  });

  // danh sách category
  const categoryRes = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories`,

    method: "GET",

    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
  });

  const supplierRes = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
  });

  const suppliers = Array.isArray(supplierRes?.data) ? supplierRes.data : [];

  return (
    <div>
      <ProductTable
        data={
          res?.data ?? {
            meta: {
              current: 1,
              pageSize: 10,
              pages: 0,
              total: 0,
            },
            results: [],
          }
        }
        categories={categoryRes?.data?.results ?? []}
        suppliers={suppliers}
        accessToken={session?.user?.access_token ?? ""}
      />
    </div>
  );
};

export default ManageProductPage;
