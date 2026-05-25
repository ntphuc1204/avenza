import { auth } from "@/auth";
import BannerTable from "@/components/admin/banner/banner.table";
import { sendRequest } from "@/utils/api";

interface IProps {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

const ManageBannerPage = async (props: IProps) => {
  const page = props?.searchParams?.page ?? 1;
  const pageSize = props?.searchParams?.pageSize ?? 10;

  const session = await auth();

  // Fetch banners
  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/banners`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    nextOption: {
      next: {
        tags: ["list-banners"],
      },
    },
  });

  const bannerData = Array.isArray(res?.data)
    ? {
        results: res.data,
        meta: {
          current: Number(page),
          pageSize: Number(pageSize),
          pages: 1,
          total: res.data.length,
        },
      }
    : {
        results: res?.data?.results || [],
        meta: {
          current: Number(page),
          pageSize: Number(pageSize),
          pages: res?.data?.meta?.pages || 1,
          total: res?.data?.meta?.total || 0,
        },
      };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1>Quản Lý Banner</h1>
      </div>
      <BannerTable
        data={bannerData}
        accessToken={session?.user?.access_token || ""}
      />
    </div>
  );
};

export default ManageBannerPage;
