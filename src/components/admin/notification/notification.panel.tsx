"use client";

import { Badge, Button, Card, Divider, List, Space, Spin, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  const [newPaidOrdersCount, setNewPaidOrdersCount] = useState(0);
  const lastOrderAt = useRef<string | null>(null);
  const lastPaidAt = useRef<string | null>(null);

  const accessToken = session?.user?.access_token;

  const fetchNotifications = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const orderRes = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders`,
        method: "GET",
        queryParams: { current: 1, pageSize: 20 },
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const fetchedOrders = orderRes?.data?.results ?? [];

      if (lastOrderAt.current) {
        const newOrders = fetchedOrders.filter(
          (item: IOrder) =>
            item.createdAt && item.createdAt > lastOrderAt.current,
        );
        setNewOrdersCount(newOrders.length);
      }

      if (lastPaidAt.current) {
        const newPaidOrders = fetchedOrders.filter(
          (item: IOrder) =>
            item.paymentStatus === "SUCCESS" &&
            item.updatedAt &&
            item.updatedAt > lastPaidAt.current,
        );
        setNewPaidOrdersCount(newPaidOrders.length);
      }

      const latestOrder = fetchedOrders.find(
        (item: IOrder) => item.createdAt,
      );
      if (latestOrder?.createdAt) {
        lastOrderAt.current = latestOrder.createdAt;
      }

      const latestPaidOrder = fetchedOrders
        .filter((item: IOrder) => item.paymentStatus === "SUCCESS")
        .sort((a, b) =>
          new Date(b.updatedAt || "").getTime() -
          new Date(a.updatedAt || "").getTime(),
        )[0];
      if (latestPaidOrder?.updatedAt) {
        lastPaidAt.current = latestPaidOrder.updatedAt;
      }

      setOrders(fetchedOrders);
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
      orders
        .filter(
          (order) =>
            order.orderStatus === "PENDING" || order.paymentStatus === "SUCCESS",
        )
        .map((order) => ({
          title:
            order.paymentStatus === "SUCCESS"
              ? `Đơn hàng đã thanh toán: ${order._id}`
              : `Đơn hàng mới: ${order._id}`,
          description: `Giá trị ${order.totalPrice?.toLocaleString("vi-VN")} đ — Trạng thái ${order.orderStatus} / ${order.paymentStatus}`,
          date: order.paymentStatus === "SUCCESS" ? order.updatedAt : order.createdAt,
        })),
    [orders],
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
          <Badge count={newPaidOrdersCount} size="small">
            <Card title="Đã thanh toán" bordered>
              <Typography.Text>
                Số đơn hàng thanh toán mới: {newPaidOrdersCount}
              </Typography.Text>
            </Card>
          </Badge>
        </Space>

        <Card
          title="Danh sách đơn hàng mới / đã thanh toán"
          extra={
            <Link href="/dashboard/orders">
              <Button type="link">Xem quản lý đơn hàng</Button>
            </Link>
          }
          bordered
        >
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

        <Divider />
      </div>
    </Spin>
  );
};

export default NotificationPanel;
