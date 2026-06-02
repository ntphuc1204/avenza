import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AdminContent from "@/components/layout/admin.content";
import AdminFooter from "@/components/layout/admin.footer";
import AdminHeader from "@/components/layout/admin.header";
import AdminSideBar from "@/components/layout/admin.sidebar";
import { AdminContextProvider } from "@/library/admin.context";
import "../css/admin.css";
import "@/styles/table.css";

const AdminLayout = async ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const session = await auth();

  if (!session) {
    redirect("/auth/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <AdminContextProvider>
      <div className="admin-layout">
        <div className="left-side" style={{ width: 80 }}>
          <AdminSideBar />
        </div>
        <div className="right-side">
          <AdminHeader session={session} />
          <AdminContent>{children}</AdminContent>
          <AdminFooter />
        </div>
      </div>
    </AdminContextProvider>
  );
};

export default AdminLayout;
