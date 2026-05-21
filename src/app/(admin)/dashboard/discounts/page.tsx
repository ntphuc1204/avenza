import { auth } from "@/auth";
import DiscountTable from "@/components/admin/discount/discount.table";
import { sendRequest } from "@/utils/api";

interface IProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const ManageDiscountsPage = async (props: IProps) => {
  const current = props?.searchParams?.current ?? 1;
  const pageSize = props?.searchParams?.pageSize ?? 20;
  const session = await auth();

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/discounts/admin`,
    method: "GET",
    queryParams: {
      current,
      pageSize,
    },
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    nextOption: {
      next: { tags: ["list-discounts"] },
    },
  });

  return (
    <DiscountTable
      data={res?.data?.results ?? []}
      accessToken={session?.user?.access_token}
    />
  );
};

export default ManageDiscountsPage;

