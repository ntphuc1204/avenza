import { auth } from "@/auth";
import SupplierTable from "@/components/admin/supplier/supplier.table";
import { sendRequest } from "@/utils/api";

interface IProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

const ManageSuppliersPage = async (props: IProps) => {
  const search = props?.searchParams?.search ?? "";
  const session = await auth();

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers`,
    method: "GET",
    queryParams: {
      ...(search && { search }),
    },
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    nextOption: {
      next: { tags: ["list-suppliers"] },
    },
  });

  const suppliers = Array.isArray(res?.data) ? res.data : [];

  return (
    <SupplierTable
      suppliers={suppliers}
      accessToken={session?.user?.access_token}
    />
  );
};

export default ManageSuppliersPage;
