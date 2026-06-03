import { auth } from "@/auth";
import { sendRequest } from "@/utils/api";
import OrderTable from "@/components/admin/order/order.table";

interface IProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const ManageOrdersPage = async (props: IProps) => {
  const current = Number(props?.searchParams?.current) || 1;
  const pageSize = Number(props?.searchParams?.pageSize) || 20;
  const query = (props?.searchParams?.query as string) || "";
  const session = await auth();

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders`,
    method: "GET",
    queryParams: {
      current,
      pageSize,
      ...(query && { query }),
    },
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    nextOption: {
      next: { tags: ["list-orders"] },
    },
  });

  return (
    <div>
      <OrderTable
        data={
          res?.data ?? {
            meta: { current: 1, pageSize: 20, pages: 0, total: 0 },
            results: [],
          }
        }
        accessToken={session?.user?.access_token}
      />
    </div>
  );
};

export default ManageOrdersPage;
