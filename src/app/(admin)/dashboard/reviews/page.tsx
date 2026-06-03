import { auth } from "@/auth";
import { sendRequest } from "@/utils/api";
import ReviewTable from "@/components/admin/review/review.table";

interface IProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const parseNumberParam = (value: string | string[] | undefined, fallback: number) => {
  if (!value) return fallback;
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const ManageReviewPage = async (props: IProps) => {
  const current = parseNumberParam(props?.searchParams?.current, 1);
  const pageSize = parseNumberParam(props?.searchParams?.pageSize, 20);
  const search = props?.searchParams?.search ?? "";
  const session = await auth();

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reviews`,
    method: "GET",
    queryParams: {
      current,
      pageSize,
      ...(search && { search }),
    },
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    nextOption: {
      next: { tags: ["list-reviews"] },
    },
  });

  return (
    <div>
      <ReviewTable
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

export default ManageReviewPage;
