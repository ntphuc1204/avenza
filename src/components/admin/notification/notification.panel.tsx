"use client";

import { Badge, Card, Divider, List, Space, Spin, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";

interface IOrder {
  _id: string;
  userId?: any;
  totalPrice: number;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
}

interface IAiChat {
  _id: string;
  userId: string;
  sender: string;
  message: string;
  createdAt?: string;
}

const NotificationPanel = () => {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [chats, setChats] = useState<IAiChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newChatsCount, setNewChatsCount] = useState(0);
  const lastOrderAt = useRef<string | null>(null);
  const lastChatAt = useRef<string | null>(null);

  const accessToken = session?.user?.access_token;

  const fetchNotifications = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [orderRes, chatRes] = await Promise.all([
        sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders`,
          method: "GET",
          queryParams: { current: 1, pageSize: 10 },
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/history`,
          method: "GET",
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ]);

      const fetchedOrders = orderRes?.data?.results ?? [];
      const fetchedChats = chatRes?.data ?? [];

      if (lastOrderAt.current) {
        const newOrders = fetchedOrders.filter(
          (item: IOrder) =>
            item.createdAt && item.createdAt > lastOrderAt.current,
        );
        setNewOrdersCount(newOrders.length);
      }
      if (lastChatAt.current) {
        const newChats = fetchedChats.filter(
          (item: IAiChat) =>
            item.createdAt && item.createdAt > lastChatAt.current,
        );
        setNewChatsCount(newChats.length);
      }

      if (fetchedOrders.length > 0 && fetchedOrders[0]?.createdAt) {
        lastOrderAt.current = fetchedOrders[0].createdAt;
      }
      if (fetchedChats.length > 0 && fetchedChats[0]?.createdAt) {
        lastChatAt.current = fetchedChats[0].createdAt;
      }

      setOrders(fetchedOrders);
      setChats(fetchedChats.slice(0, 20));
    } catch (error) {
      console.error("Notification fetch error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [accessToken]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => window.clearInterval(interval);
  }, [accessToken]);

  const orderNotifications = useMemo(
    () =>
      orders.map((order) => ({
        title: `Đơn hàng mới: ${order._id}`,
        description: `Giá trị ${order.totalPrice?.toLocaleString("vi-VN")} đ — Trạng thái ${order.orderStatus} / ${order.paymentStatus}`,
        date: order.createdAt,
      })),
    [orders],
  );

  const chatNotifications = useMemo(
    () =>
      chats.map((chat) => ({
        title: `${chat.sender === "user" ? "Người dùng" : "AI"}`,
        description: chat.message,
        date: chat.createdAt,
      })),
    [chats],
  );

  return (
    <Spin spinning={loading}>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Typography.Title level={3}>Thông báo realtime</Typography.Title>
        <Space size={16} direction="horizontal">
          <Badge count={newOrdersCount} size="small">
            <Card title="Đơn hàng mới" bordered>
              <Typography.Text>
                Số đơn hàng mới kể từ lần refresh trước: {newOrdersCount}
              </Typography.Text>
            </Card>
          </Badge>
          <Badge count={newChatsCount} size="small">
            <Card title="Chat AI mới" bordered>
              <Typography.Text>
                Số tin nhắn chat mới: {newChatsCount}
              </Typography.Text>
            </Card>
          </Badge>
        </Space>

        <Card title="Danh sách đơn hàng gần nhất" bordered>
          <List
            dataSource={orderNotifications}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.title}
                  description={item.description}
                />
                <div>
                  {item.date ? new Date(item.date).toLocaleString() : "-"}
                </div>
              </List.Item>
            )}
          />
        </Card>

        <Card title="Lịch sử chat AI" bordered>
          <List
            dataSource={chatNotifications}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta
                  title={item.title}
                  description={item.description}
                />
                <div>
                  {item.date ? new Date(item.date).toLocaleString() : "-"}
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
