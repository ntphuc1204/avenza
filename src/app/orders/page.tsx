"use client";

import {
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Row,
  Space,
  Tag,
  Typography,
  notification,
} from "antd";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";
import { sendRequest } from "@/utils/api";

const { Title, Text } = Typography;

const OrdersPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadOrders = async () => {
    if (!session?.user?.access_token) {
      return;
    }
    setLoading(true);
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
      queryParams: { current: 1, pageSize: 20 },
    });
    setLoading(false);
    if (res?.data?.results) {
      setOrders(res.data.results);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [session]);

  if (!session) {
    return (
      <GuestLayout>
        <div
          style={{
            textAlign: "center",
            padding: 40,
            background: "#ffffff",
            borderRadius: 20,
          }}
        >
          <Title level={3}>Đăng nhập để xem đơn hàng</Title>
          <Button type="primary" onClick={() => router.push("/auth/login")}>
            Đăng nhập ngay
          </Button>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>Quản lý đơn hàng</Title>
        <Text type="secondary">
          Xem trạng thái đơn hàng, thanh toán và chi tiết giao hàng.
        </Text>
      </div>

      {orders.length ? (
        <Row gutter={[24, 24]}>
          {orders.map((order) => (
            <Col key={order._id} xs={24} md={12}>
              <Card style={{ borderRadius: 20 }} hoverable>
                <Space direction="vertical" size={12} style={{ width: "100%" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text strong>Đơn hàng #{order._id.slice(-6)}</Text>
                    <Badge
                      status={
                        order.orderStatus === "SUCCESS"
                          ? "success"
                          : order.orderStatus === "PENDING"
                            ? "processing"
                            : "default"
                      }
                      text={order.orderStatus}
                    />
                  </div>
                  <Text>
                    Thanh toán:{" "}
                    <Tag
                      color={
                        order.paymentStatus === "SUCCESS"
                          ? "green"
                          : order.paymentStatus === "FAILED"
                            ? "red"
                            : "gold"
                      }
                    >
                      {order.paymentStatus}
                    </Tag>
                  </Text>
                  <Text>
                    Giá trị: {Number(order.totalPrice).toLocaleString("vi-VN")}{" "}
                    ₫
                  </Text>
                  <Text>
                    Ngày: {new Date(order.createdAt).toLocaleString("vi-VN")}
                  </Text>
                  <Divider />
                  <Title level={5}>Sản phẩm ({order.products.length})</Title>
                  {order.products.slice(0, 3).map((item: any) => (
                    <div
                      key={item.productId}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <Text>{item.name}</Text>
                      <Text>
                        {item.quantity} x{" "}
                        {Number(item.price).toLocaleString("vi-VN")} ₫
                      </Text>
                    </div>
                  ))}
                  {order.products.length > 3 ? (
                    <Text type="secondary">
                      Và {order.products.length - 3} sản phẩm khác...
                    </Text>
                  ) : null}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card
          style={{ borderRadius: 20, background: "#ffffff" }}
          loading={loading}
        >
          <Empty description="Chưa có đơn hàng" />
        </Card>
      )}
    </GuestLayout>
  );
};

export default OrdersPage;
