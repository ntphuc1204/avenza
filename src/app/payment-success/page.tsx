"use client";

import { Button, Card, Result } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";

const PaymentSuccessPage = () => {
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
            <CheckCircleOutlined
              style={{
                color: "#52c41a",
              }}
            />
          }
          status="success"
          title="Thanh toán thành công"
          subTitle={`Mã đơn hàng: ${orderId || "N/A"}`}
          extra={[
            <Button
              type="primary"
              key="home"
              onClick={() => router.push("/")}
            >
              Về trang chủ
            </Button>,

            <Button
              key="orders"
              onClick={() => router.push("/orders")}
            >
              Xem đơn hàng
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;