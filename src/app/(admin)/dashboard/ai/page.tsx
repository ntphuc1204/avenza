import { auth } from "@/auth";
import AiPanel from "@/components/admin/ai/ai.panel";

interface IProps {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

const AIPage = async (props: IProps) => {
  const session = await auth();

  return (
    <div>
      <AiPanel accessToken={session?.user?.access_token} />
    </div>
  );
};

export default AIPage;
