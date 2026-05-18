import { auth } from "@/auth";
import { sendRequest } from "@/utils/api";
import CartManager from "@/components/admin/cart/cart.manager";

interface IProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const ManageCartPage = async (props: IProps) => {
  const session = await auth();

  const res = await sendRequest<IBackendRes<any>>({
    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart`,
    method: "GET",
    headers: {
      Authorization: `Bearer ${session?.user?.access_token}`,
    },
    nextOption: {
      next: { tags: ["cart-data"] },
    },
  });

  return (
    <div>
      <CartManager data={res?.data ?? { items: [], totalPrice: 0 }} accessToken={session?.user?.access_token} />
    </div>
  );
};

export default ManageCartPage;
