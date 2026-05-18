import { auth } from "@/auth";
import { sendRequest } from "@/utils/api";
import ReviewTable from "@/components/admin/review/review.table";

interface IProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const ManageReviewPage = async (props: IProps) => {
  const session = await auth();

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reviews`,
    method: "GET",
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
