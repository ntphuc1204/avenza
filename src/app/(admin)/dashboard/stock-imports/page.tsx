import { auth } from "@/auth";
import StockImportPanel from "@/components/admin/stock-import/stock-import.panel";
import { sendRequest } from "@/utils/api";

const StockImportsPage = async () => {
  const session = await auth();

  const headers = {
    Authorization: `Bearer ${session?.user?.access_token}`,
  };

  const [productsRes, suppliersRes, importsRes] = await Promise.all([
    sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`,
      method: "GET",
      queryParams: { current: 1, pageSize: 500 },
      headers,
    }),
    sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers`,
      method: "GET",
      headers,
    }),
    sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/stock-imports`,
      method: "GET",
      headers,
    }),
  ]);

  const products = productsRes?.data?.results ?? [];
  const suppliers = Array.isArray(suppliersRes?.data) ? suppliersRes.data : [];
  const imports = Array.isArray(importsRes?.data) ? importsRes.data : [];

  return (
    <StockImportPanel
      products={products}
      suppliers={suppliers}
      imports={imports}
      accessToken={session?.user?.access_token}
    />
  );
};

export default StockImportsPage;
