"use client";

import {
  Badge,
  Button,
  Card,
  Divider,
  List,
  Space,
  Spin,
  Tag,
  Typography,
  notification,
} from "antd";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { sendRequest } from "@/utils/api";

interface INotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  level: string;
  targetRole?: string;
  targetUserId?: string;
  link?: string;
  data?: any;
  isRead?: boolean;
  createdAt?: string;
}

const NotificationPanel = () => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const accessToken = session?.user?.access_token;

  const fetchNotifications = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);

      const [listRes, countRes] = await Promise.all([
        sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notifications`,
          method: "GET",
          queryParams: {
            current: 1,
            pageSize: 20,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
        sendRequest<IBackendRes<{ count: number }>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notifications/unread-count`,
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      ]);

      setNotifications(listRes?.data?.results ?? []);
      setUnreadCount(countRes?.data?.count ?? 0);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
      {
        transports: ["websocket"],
      },
    );

    socketRef.current = socket;

    socket.on("notification-created", (item: INotification) => {
      if (item.targetRole && item.targetRole !== session?.user?.role) return;
      if (item.targetUserId && item.targetUserId !== session?.user?._id) return;

      setNotifications((prev) => [item, ...prev]);
      setUnreadCount((prev) => prev + 1);

      notification.success({
        message: item.title,
        description: item.message,
        placement: "topRight",
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, session?.user?._id, session?.user?.role]);

  const markAllAsRead = async () => {
    if (!accessToken) return;

    await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notifications/read-all`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setUnreadCount(0);
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    window.dispatchEvent(new Event("notificationsRead"));
  };

  return (
    <Spin spinning={loading}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Typography.Title level={3}>Thông báo realtime</Typography.Title>

        <Space size={16} wrap>
          <Badge count={unreadCount}>
            <Card title="Thông báo chưa đọc">
              <Typography.Text>Có {unreadCount} thông báo mới</Typography.Text>
            </Card>
          </Badge>
          <Button onClick={markAllAsRead}>Đánh dấu đã đọc</Button>
        </Space>

        <Card
          title="Danh sách thông báo"
          extra={
            <Link href="/dashboard/orders">
              <Button type="link">Xem quản lý đơn hàng</Button>
            </Link>
          }
        >
          <List
            dataSource={notifications}
            locale={{ emptyText: "Không có thông báo" }}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{item.title}</span>
                      <Tag color={item.isRead ? "default" : "blue"}>
                        {item.isRead ? "Đã đọc" : "Mới"}
                      </Tag>
                    </Space>
                  }
                  description={
                    <>
                      <div>{item.message}</div>
                      <div>
                        Giá trị:{" "}
                        {item.data?.totalPrice
                          ? Number(item.data.totalPrice).toLocaleString("vi-VN")
                          : "-"}{" "}
                        đ
                      </div>
                      <div>Thanh toán: {item.data?.paymentStatus || "-"}</div>
                    </>
                  }
                />

                <div>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("vi-VN")
                    : "-"}
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Divider />
      </div>
    </Spin>
  );
};

export default NotificationPanel;
