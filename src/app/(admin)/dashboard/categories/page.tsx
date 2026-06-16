import { auth } from "@/auth";
import { sendRequest } from "@/utils/api";
import CategoryTable from "@/components/admin/category/category.table";

interface IProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const ManageCategoryPage = async (props: IProps) => {
  const current = props?.searchParams?.current ?? 1;
  const pageSize = props?.searchParams?.pageSize ?? 20;
  const search = props?.searchParams?.search ?? "";
  const session = await auth();

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories`,
    method: "GET",
    queryParams: {
      current,
      pageSize,
      ...(search && { search }),
      includeInactive: true,
      withProductCount: true,
    },
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    nextOption: {
      next: { tags: ["list-categories"] },
    },
  });

  return (
    <div>
      <CategoryTable
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

export default ManageCategoryPage;
