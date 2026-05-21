"use client";

import { Button, Card, Result } from "antd";
import { CloseCircleOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";

const PaymentFailedPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = searchParams.get("orderId");

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f5f5",
        padding: 20,
        overflow: "hidden",
        boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
      }}
    >
      <Card
        style={{
          width: 600,
          borderRadius: 20,
        }}
      >
        <Result
          icon={
            <CloseCircleOutlined
              style={{
                color: "#ff4d4f",
              }}
            />
          }
          status="error"
          title="Thanh toán thất bại"
          subTitle={`Mã đơn hàng: ${orderId || "N/A"}`}
          extra={[
            <Button
              type="primary"
              key="retry"
              onClick={() => router.push("/cart")}
            >
              Thanh toán lại
            </Button>,

            <Button key="home" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default PaymentFailedPage;
