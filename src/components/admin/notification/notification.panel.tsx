"use client";

import {
  Badge,
  Button,
  Card,
  Divider,
  List,
  Space,
  Spin,
  Typography,
  notification,
  Tag,
} from "antd";

import { useEffect, useRef, useState } from "react";

import Link from "next/link";

import { useSession } from "next-auth/react";

import { io, Socket } from "socket.io-client";

import { sendRequest } from "@/utils/api";

interface IOrder {
  _id: string;
  userId?: any;
  totalPrice: number;
  orderStatus?: string;
  paymentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

const NotificationPanel = () => {
  const { data: session } = useSession();

  const [orders, setOrders] = useState<IOrder[]>([]);

  const [loading, setLoading] = useState(true);

  const [newOrdersCount, setNewOrdersCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  const accessToken = session?.user?.access_token;

  // load danh sách ban đầu
  const fetchOrders = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);

      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders`,

        method: "GET",

        queryParams: {
          current: 1,
          pageSize: 20,
        },

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data?.results) {
        const pendingOrders = res.data.results.filter(
          (item: IOrder) => item.orderStatus === "PENDING",
        );

        setOrders(pendingOrders);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [accessToken]);

  // realtime socket
  useEffect(() => {
    if (!accessToken) return;

    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
      {
        transports: ["websocket"],
      },
    );

    socketRef.current = socket;

    socket.on("new-order", (order: IOrder) => {
      if (order.orderStatus !== "PENDING") return;

      // thêm realtime vào đầu list
      setOrders((prev) => [order, ...prev]);

      // badge đỏ
      setNewOrdersCount((prev) => prev + 1);

      // popup notification
      notification.success({
        message: "Đơn hàng mới",
        description: `Có đơn hàng mới #${order._id.slice(-6)}`,
        placement: "topRight",
      });
    });

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  return (
    <Spin spinning={loading}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <Typography.Title level={3}>Thông báo realtime</Typography.Title>

        <Space size={16}>
          <Badge count={newOrdersCount}>
            <Card title="Đơn hàng mới">
              <Typography.Text>
                Có {newOrdersCount} đơn hàng mới
              </Typography.Text>
            </Card>
          </Badge>
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
            dataSource={orders}
            locale={{
              emptyText: "Không có thông báo",
            }}
            renderItem={(order) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      <span>Đơn hàng #{order._id.slice(-6)}</span>

                      <Tag color="orange">{order.orderStatus}</Tag>
                    </Space>
                  }
                  description={
                    <>
                      <div>
                        Giá trị: {order.totalPrice?.toLocaleString("vi-VN")} đ
                      </div>

                      <div>Thanh toán: {order.paymentStatus}</div>
                    </>
                  }
                />

                <div>
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleString("vi-VN")
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
