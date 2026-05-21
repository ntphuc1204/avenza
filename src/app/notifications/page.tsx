"use client";

import { Badge, Button, Card, Empty, List, Space, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";
import { sendRequest } from "@/utils/api";

const { Title, Text } = Typography;

const NotificationsPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadNotifications = async () => {
    if (!session?.user?.access_token) return;

    setLoading(true);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notifications`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
      queryParams: { current: 1, pageSize: 20 },
    });

    if (res?.data?.results) {
      setNotifications(res.data.results);

      await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notifications/read-all`,
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
      });

      window.dispatchEvent(new Event("notificationsRead"));
    }

    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [session]);

  const notificationItems = useMemo(() => {
    return notifications.map((item) => ({
      ...item,
      description: item.message,
      updatedAt: item.updatedAt || item.createdAt,
    }));
  }, [notifications]);

  if (!session) {
    return (
      <GuestLayout>
        <div
          style={{
            textAlign: "center",
            padding: 40,
            background: "#ffffff",
            borderRadius: 20,
            overflow: "hidden",
            boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
          }}
        >
          <Title level={3}>Đăng nhập để xem thông báo đơn hàng</Title>
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
        <Title level={3}>Thông báo đơn hàng</Title>
        <Text type="secondary">
          Những cập nhật mới nhất về trạng thái đơn hàng và thanh toán của bạn.
        </Text>
      </div>

      {notificationItems.length ? (
        <Card style={{ borderRadius: 20 }} bodyStyle={{ padding: 0 }}>
          <List
            loading={loading}
            itemLayout="vertical"
            dataSource={notificationItems}
            renderItem={(item) => (
              <List.Item
                key={item._id}
                actions={[
                  <Button type="link" onClick={() => router.push(item.link || "/orders")}>
                    Xem chi tiết
                  </Button>,
                ]}
                style={{
                  padding: 20,
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <List.Item.Meta
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 16,
                      }}
                    >
                      <Text strong>{item.title}</Text>
                      <Badge
                        status={
                          item.data?.orderStatus === "DELIVERED"
                            ? "success"
                            : item.data?.orderStatus === "PENDING"
                              ? "processing"
                              : "default"
                        }
                        text={item.data?.orderStatus || item.type}
                      />
                    </div>
                  }
                  description={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      <Text type="secondary">{item.description}</Text>
                      <Text type="secondary">
                        Tổng:{" "}
                        {Number(item.data?.totalPrice || 0).toLocaleString("vi-VN")}{" "}
                        đ
                      </Text>
                    </div>
                  }
                />
                <Space
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                  }}
                >
                  <Text type="secondary">
                    Cập nhật: {new Date(item.updatedAt).toLocaleString("vi-VN")}
                  </Text>
                </Space>
              </List.Item>
            )}
          />
        </Card>
      ) : (
        <Card style={{ borderRadius: 20 }} loading={loading}>
          <Empty description="Chưa có thông báo cập nhật đơn hàng" />
        </Card>
      )}
    </GuestLayout>
  );
};

export default NotificationsPage;
