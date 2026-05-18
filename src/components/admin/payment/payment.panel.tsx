"use client";

import { Button, Form, Input, message, Result, Typography } from "antd";
import { useState } from "react";
import { sendRequest } from "@/utils/api";

interface IProps {
  accessToken?: string;
}

const PaymentPanel = ({ accessToken }: IProps) => {
  const [paymentResponse, setPaymentResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");
      return;
    }

    setLoading(true);
    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/payments/vnpay`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          orderId: values.orderId,
          amount: Number(values.amount),
        },
      });

      if (res?.data) {
        setPaymentResponse(res.data);
        message.success("Yêu cầu thanh toán VNPay đã gửi");
      } else {
        message.error(res?.message || "Tạo yêu cầu thanh toán thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi gọi API thanh toán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 720 }}>
      <Typography.Title level={3}>Quản lý Payments</Typography.Title>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          name="orderId"
          label="Order ID"
          rules={[{ required: true, message: "Vui lòng nhập orderId" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="amount"
          label="Amount (VND)"
          rules={[{ required: true, message: "Vui lòng nhập số tiền" }]}
        >
          <Input type="number" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Tạo yêu cầu VNPay
          </Button>
        </Form.Item>
      </Form>

      {paymentResponse ? (
        <Result
          status="success"
          title="Kết quả thanh toán"
          subTitle={
            paymentResponse.paymentUrl
              ? "Đã nhận URL thanh toán VNPay."
              : paymentResponse.message
          }
          extra={
            paymentResponse.paymentUrl
              ? [
                  <Button
                    key="link"
                    type="primary"
                    href={paymentResponse.paymentUrl}
                    target="_blank"
                  >
                    Mở VNPay
                  </Button>,
                ]
              : []
          }
        >
          <Typography.Text code style={{ wordBreak: "break-all" }}>
            {JSON.stringify(paymentResponse)}
          </Typography.Text>
        </Result>
      ) : null}
    </div>
  );
};

export default PaymentPanel;
