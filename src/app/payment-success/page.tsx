"use client";

import { Button, Card, Result, Spin } from "antd";
import { CheckCircleOutlined } from "@ant-design/icons";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { sendRequest } from "@/utils/api";

const PaymentSuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const transactionId = searchParams.get("transactionId");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkError, setCheckError] = useState(false);

  useEffect(() => {
    const checkOrder = async () => {
      try {
        if (!transactionId) {
          setCheckError(true);
          setLoading(false);
          return;
        }

        console.log("Checking order status for transaction:", transactionId);

        const res = await sendRequest<any>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/payments/check-order/${transactionId}`,
          method: "GET",
        });

        if (res?.success && res?.orderId) {
          setOrderId(res.orderId);
        } else {
          console.warn("Order check result:", res?.message || "Unknown error");
          // Still show success but orderId might be pending
          if (res?.orderId) {
            setOrderId(res.orderId);
          }
        }
      } catch (error) {
        console.error("Error checking order:", error);
        setCheckError(true);
      } finally {
        setLoading(false);
      }
    };

    checkOrder();
  }, [transactionId]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f5f5f5",
        }}
      >
        <Spin size="large" tip="Đang xác nhận thanh toán..." />
      </div>
    );
  }

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
            <CheckCircleOutlined
              style={{
                color: "#52c41a",
              }}
            />
          }
          status="success"
          title="Thanh toán thành công"
          subTitle={
            orderId
              ? `Mã đơn hàng: ${orderId}`
              : `Mã giao dịch: ${transactionId || "N/A"}`
          }
          extra={[
            <Button type="primary" key="home" onClick={() => router.push("/")}>
              Về trang chủ
            </Button>,

            <Button key="orders" onClick={() => router.push("/orders")}>
              Xem đơn hàng
            </Button>,
          ]}
        />
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
