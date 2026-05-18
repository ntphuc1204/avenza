"use client";

import { Card, Col, DatePicker, Divider, Row, Spin, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { sendRequest } from "@/utils/api";
import { useSession } from "next-auth/react";

interface IOrderStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalReviews: number;
  totalPayments: number;
  totalCarts: number;
  topProducts: Array<{ _id: string; quantity: number }>;
  orderStatuses: Record<string, number>;
  paymentStatuses: Record<string, number>;
}

const AdminCard = () => {
  const { data: session } = useSession();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [orderStats, setOrderStats] = useState<IOrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalProducts: 0,
    totalCategories: 0,
    totalReviews: 0,
    totalPayments: 0,
    totalCarts: 0,
    topProducts: [],
    orderStatuses: {},
    paymentStatuses: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const queryParams: any = {};
        if (dateRange) {
          queryParams.from = dateRange[0];
          queryParams.to = dateRange[1];
        }

        const orderRes = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/dashboard/stats`,
          method: "GET",
          queryParams,
          headers: {
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
        });

        if (orderRes?.data) {
          setOrderStats({
            totalOrders: orderRes.data.totalOrders || 0,
            totalRevenue: orderRes.data.totalRevenue || 0,
            totalUsers: orderRes.data.totalUsers || 0,
            activeUsers: orderRes.data.activeUsers || 0,
            inactiveUsers: orderRes.data.inactiveUsers || 0,
            totalProducts: orderRes.data.totalProducts || 0,
            totalCategories: orderRes.data.totalCategories || 0,
            totalReviews: orderRes.data.totalReviews || 0,
            totalPayments: orderRes.data.totalPayments || 0,
            totalCarts: orderRes.data.totalCarts || 0,
            topProducts: orderRes.data.topProducts || [],
            orderStatuses: orderRes.data.orderStatuses || {},
            paymentStatuses: orderRes.data.paymentStatuses || {},
          });
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.access_token) {
      fetchStatistics();
    }
  }, [session?.user?.access_token, dateRange]);

  const orderStatusChart = useMemo(
    () =>
      Object.entries(orderStats.orderStatuses).map(([name, value]) => ({
        name,
        value,
      })),
    [orderStats.orderStatuses],
  );

  const paymentStatusChart = useMemo(
    () =>
      Object.entries(orderStats.paymentStatuses).map(([name, value]) => ({
        name,
        value,
      })),
    [orderStats.paymentStatuses],
  );

  const renderBarChart = (data: Array<{ name: string; value: number }>) => {
    const maxValue = Math.max(...data.map((item) => item.value), 1);
    return (
      <div>
        {data.map((item) => (
          <div key={item.name} style={{ marginBottom: 10 }}>
            <Typography.Text strong>{item.name}</Typography.Text>
            <div
              style={{
                background: "#f0f0f0",
                borderRadius: 8,
                overflow: "hidden",
                height: 14,
                marginTop: 6,
              }}
            >
              <div
                style={{
                  width: `${(item.value / maxValue) * 100}%`,
                  background: "#1890ff",
                  height: "100%",
                }}
              />
            </div>
            <Typography.Text type="secondary"> {item.value}</Typography.Text>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Spin spinning={loading}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Filter theo khoảng thời gian" bordered={false}>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              onChange={(_, dateStrings) =>
                setDateRange(dateStrings as [string, string] | null)
              }
            />
            {dateRange ? (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography.Text type="secondary">
                  Từ {dateRange[0]} đến {dateRange[1]}
                </Typography.Text>
                <Typography.Link onClick={() => setDateRange(null)}>
                  Xóa
                </Typography.Link>
              </div>
            ) : null}
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Total Users" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>
              {orderStats.totalUsers}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Active Users" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
              {orderStats.activeUsers}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Inactive Users" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#ff4d4f" }}>
              {orderStats.inactiveUsers}
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Total Orders" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalOrders}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Total Revenue" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#fa8c16" }}>
              {orderStats.totalRevenue?.toLocaleString("vi-VN")} đ
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Total Products" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalProducts}
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Total Categories" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalCategories}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Total Reviews" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalReviews}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Total Payments" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalPayments}
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Total Carts" bordered={false}>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalCarts}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Order Status" bordered={false}>
            {Object.keys(orderStats.orderStatuses).length === 0 ? (
              <Typography.Text>Chưa có đơn hàng.</Typography.Text>
            ) : (
              Object.entries(orderStats.orderStatuses).map(
                ([status, count]) => (
                  <div key={status} style={{ marginBottom: 8 }}>
                    <Typography.Text strong>{status}:</Typography.Text>{" "}
                    <Typography.Text>{count}</Typography.Text>
                  </div>
                ),
              )
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Payment Status" bordered={false}>
            {Object.keys(orderStats.paymentStatuses).length === 0 ? (
              <Typography.Text>Chưa có thanh toán.</Typography.Text>
            ) : (
              Object.entries(orderStats.paymentStatuses).map(
                ([status, count]) => (
                  <div key={status} style={{ marginBottom: 8 }}>
                    <Typography.Text strong>{status}:</Typography.Text>{" "}
                    <Typography.Text>{count}</Typography.Text>
                  </div>
                ),
              )
            )}
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title="Order Status Chart" bordered={false}>
            {orderStatusChart.length ? (
              renderBarChart(orderStatusChart)
            ) : (
              <Typography.Text>Không có dữ liệu.</Typography.Text>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Payment Status Chart" bordered={false}>
            {paymentStatusChart.length ? (
              renderBarChart(paymentStatusChart)
            ) : (
              <Typography.Text>Không có dữ liệu.</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>
      <Card title="Top Products" bordered={false}>
        {orderStats.topProducts.length === 0 ? (
          <Typography.Text>Không có sản phẩm nổi bật.</Typography.Text>
        ) : (
          orderStats.topProducts.map((item, index) => (
            <div key={item._id} style={{ marginBottom: 12 }}>
              <Typography.Text strong>{index + 1}. </Typography.Text>
              <Typography.Text>{item._id}</Typography.Text>
              <Typography.Text type="secondary">
                {" "}
                — {item.quantity} sản phẩm
              </Typography.Text>
            </div>
          ))
        )}
      </Card>
      <Divider />
    </Spin>
  );
};

export default AdminCard;
