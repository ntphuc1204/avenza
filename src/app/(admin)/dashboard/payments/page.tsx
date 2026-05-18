import { auth } from "@/auth";
import PaymentPanel from "@/components/admin/payment/payment.panel";

interface IProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const ManagePaymentsPage = async (props: IProps) => {
  const session = await auth();

  return (
    <div>
      <PaymentPanel accessToken={session?.user?.access_token} />
    </div>
  );
};

export default ManagePaymentsPage;
