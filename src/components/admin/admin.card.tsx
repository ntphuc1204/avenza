"use client";

import {
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Row,
  Segmented,
  Spin,
  Table,
  Typography,
  message,
} from "antd";
import { DownloadOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { sendRequest } from "@/utils/api";
import { useSession } from "next-auth/react";
import { LineChart, PieChart, BarChart } from "./charts";

type StatsPeriod = "day" | "month" | "year";

interface IOrderStats {
  totalOrders: number;
  totalRevenue: number;
  totalCost?: number;
  totalProfit?: number;
  profitMarginPercent?: number;
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalProducts: number;
  totalCategories: number;
  totalReviews: number;
  totalPayments: number;
  totalCarts: number;
  topProducts: Array<{ _id: string; name?: string; quantity: number }>;
  orderStatuses: Record<string, number>;
  paymentStatuses: Record<string, number>;
}

interface ITimeseriesRow {
  period: string;
  orderCount: number;
  revenue: number;
}

const PERIOD_OPTIONS: { label: string; value: StatsPeriod }[] = [
  { label: "Theo ngày", value: "day" },
  { label: "Theo tháng", value: "month" },
  { label: "Theo năm", value: "year" },
];

const AdminCard = () => {
  const { data: session } = useSession();
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>("day");
  const [orderStats, setOrderStats] = useState<IOrderStats>({
    totalOrders: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    profitMarginPercent: 0,
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
  const [timeseries, setTimeseries] = useState<ITimeseriesRow[]>([]);
  const [timeseriesTotals, setTimeseriesTotals] = useState({
    orderCount: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stockStats, setStockStats] = useState<{
    totalCount: number;
    totalQuantity: number;
    totalValue: number;
    recent: any[];
  } | null>(null);

  const buildQueryParams = () => {
    const queryParams: Record<string, string> = {};
    if (dateRange?.[0]) queryParams.from = dateRange[0];
    if (dateRange?.[1]) queryParams.to = dateRange[1];
    return queryParams;
  };

  useEffect(() => {
    const fetchStatistics = async () => {
      setLoading(true);
      try {
        const queryParams = buildQueryParams();
        const headers = {
          Authorization: `Bearer ${session?.user?.access_token}`,
        };

        const [orderRes, seriesRes] = await Promise.all([
          sendRequest<IBackendRes<IOrderStats>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/dashboard/stats`,
            method: "GET",
            queryParams,
            headers,
          }),
          sendRequest<
            IBackendRes<{
              series: ITimeseriesRow[];
              totals: { orderCount: number; revenue: number };
            }>
          >({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/dashboard/stats/timeseries`,
            method: "GET",
            queryParams: { ...queryParams, period: statsPeriod },
            headers,
          }),
        ]);

        if (orderRes?.data) {
          setOrderStats({
            totalOrders: orderRes.data.totalOrders || 0,
            totalRevenue: orderRes.data.totalRevenue || 0,
            totalCost: orderRes.data.totalCost || 0,
            totalProfit: orderRes.data.totalProfit || 0,
            profitMarginPercent: orderRes.data.profitMarginPercent || 0,
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

        // fetch stock import stats
        try {
          const stockRes = await sendRequest<IBackendRes<any>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/stock-imports/stats`,
            method: "GET",
            headers,
          });

          if (stockRes?.data) {
            setStockStats({
              totalCount: stockRes.data.totalCount || 0,
              totalQuantity: stockRes.data.totalQuantity || 0,
              totalValue: stockRes.data.totalValue || 0,
              recent: stockRes.data.recent || [],
            });
          }
        } catch (err) {
          console.error("Error fetching stock stats:", err);
        }

        if (seriesRes?.data) {
          setTimeseries(seriesRes.data.series || []);
          setTimeseriesTotals(
            seriesRes.data.totals || { orderCount: 0, revenue: 0 },
          );
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
  }, [session?.user?.access_token, dateRange, statsPeriod]);

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

  const periodColumnTitle =
    statsPeriod === "day" ? "Ngày" : statsPeriod === "month" ? "Tháng" : "Năm";

  const handleExportExcel = async () => {
    if (!session?.user?.access_token) return;

    setExporting(true);
    try {
      const params = new URLSearchParams({ period: statsPeriod });
      const range = buildQueryParams();
      if (range.from) params.set("from", range.from);
      if (range.to) params.set("to", range.to);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/dashboard/export?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${session.user.access_token}`,
          },
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        message.error(err?.message || "Xuất Excel thất bại");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `avenza-thong-ke-${statsPeriod}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success("Đã tải file Excel");
    } catch {
      message.error("Không thể xuất Excel");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Spin spinning={loading}>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card title="Lọc theo khoảng thời gian" bordered>
            <DatePicker.RangePicker
              style={{ width: "100%" }}
              onChange={(_, dateStrings) =>
                setDateRange(
                  dateStrings[0] && dateStrings[1]
                    ? (dateStrings as [string, string])
                    : null,
                )
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
                  Xóa bộ lọc
                </Typography.Link>
              </div>
            ) : null}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Thống kê & xuất báo cáo" bordered>
            <Segmented
              block
              options={PERIOD_OPTIONS}
              value={statsPeriod}
              onChange={(value) => setStatsPeriod(value as StatsPeriod)}
              style={{ marginBottom: 12 }}
            />
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={exporting}
              onClick={handleExportExcel}
              block
            >
              Xuất Excel
            </Button>
          </Card>
        </Col>
      </Row>

      <Card
        title={`Biểu đồ thống kê ${periodColumnTitle.toLowerCase()}`}
        bordered
        style={{ marginBottom: 16 }}
      >
        {timeseries.length === 0 ? (
          <Typography.Text>
            Không có dữ liệu trong khoảng đã chọn.
          </Typography.Text>
        ) : (
          <>
            <LineChart
              data={timeseries}
              title={`Doanh thu và số đơn hàng ${periodColumnTitle.toLowerCase()}`}
              height={400}
            />
            <Table
              size="small"
              pagination={false}
              rowKey="period"
              dataSource={timeseries}
              columns={[
                {
                  title: periodColumnTitle,
                  dataIndex: "period",
                  key: "period",
                },
                {
                  title: "Số đơn",
                  dataIndex: "orderCount",
                  key: "orderCount",
                  align: "right",
                },
                {
                  title: "Doanh thu",
                  dataIndex: "revenue",
                  key: "revenue",
                  align: "right",
                  render: (v: number) => `${v.toLocaleString("vi-VN")} đ`,
                },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0}>
                    <Typography.Text strong>Tổng cộng</Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1} align="right">
                    <Typography.Text strong>
                      {timeseriesTotals.orderCount}
                    </Typography.Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2} align="right">
                    <Typography.Text strong>
                      {timeseriesTotals.revenue.toLocaleString("vi-VN")} đ
                    </Typography.Text>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </>
        )}
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng người dùng" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#1890ff" }}>
              {orderStats.totalUsers}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Người dùng hoạt động" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
              {orderStats.activeUsers}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Người dùng không hoạt động" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#ff4d4f" }}>
              {orderStats.inactiveUsers}
            </div>
          </Card>
        </Col>
      </Row>
      {/* Stock import statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng phiếu nhập" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {stockStats?.totalCount ?? 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng số lượng nhập" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#fa8c16" }}>
              {stockStats?.totalQuantity ?? 0}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng giá trị nhập" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#52c41a" }}>
              {(stockStats?.totalValue ?? 0).toLocaleString("vi-VN")} đ
            </div>
          </Card>
        </Col>
      </Row>

      {stockStats?.recent && stockStats.recent.length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col xs={24}>
            <Card title="Nhập hàng mới nhất" bordered>
              <ul style={{ paddingLeft: 16, margin: 0 }}>
                {stockStats.recent.map((r: any) => (
                  <li key={r._id} style={{ marginBottom: 6 }}>
                    <strong>{r.productId?.name || r.productId}</strong> — SL: {r.quantity} — Giá: {Number(r.importPrice || 0).toLocaleString("vi-VN")} đ
                  </li>
                ))}
              </ul>
            </Card>
          </Col>
        </Row>
      )}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng đơn hàng" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalOrders}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Doanh thu" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#fa8c16" }}>
              {orderStats.totalRevenue?.toLocaleString("vi-VN")} đ
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Giá vốn (ước tính)" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#eb2f96" }}>
              {(orderStats.totalCost ?? 0).toLocaleString("vi-VN")} đ
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Lợi nhuận" bordered>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color:
                  (orderStats.totalProfit ?? 0) >= 0 ? "#52c41a" : "#ff4d4f",
              }}
            >
              {(orderStats.totalProfit ?? 0).toLocaleString("vi-VN")} đ
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Biên lợi nhuận" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#13c2c2" }}>
              {orderStats.profitMarginPercent ?? 0}%
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng sản phẩm" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalProducts}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng danh mục" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalCategories}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng đánh giá" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalReviews}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng thanh toán" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalPayments}
            </div>
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8}>
          <Card title="Tổng giỏ hàng" bordered>
            <div style={{ fontSize: 24, fontWeight: "bold", color: "#722ed1" }}>
              {orderStats.totalCarts}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card title="Trạng thái đơn hàng" bordered>
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
          <Card title="Trạng thái thanh toán" bordered>
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
          <Card title="Biểu đồ trạng thái đơn hàng" bordered>
            {orderStatusChart.length ? (
              <PieChart data={orderStatusChart} height={350} />
            ) : (
              <Typography.Text>Không có dữ liệu.</Typography.Text>
            )}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Biểu đồ trạng thái thanh toán" bordered>
            {paymentStatusChart.length ? (
              <PieChart data={paymentStatusChart} height={350} />
            ) : (
              <Typography.Text>Không có dữ liệu.</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>
      <Card
        title="Sản phẩm bán chạy nhất"
        bordered
        style={{ marginBottom: 16 }}
      >
        {orderStats.topProducts.length === 0 ? (
          <Typography.Text>Không có sản phẩm nổi bật.</Typography.Text>
        ) : (
          <BarChart
            data={orderStats.topProducts.map((item) => ({
              name: item.name || item._id,
              value: item.quantity,
            }))}
            title="Top sản phẩm bán chạy"
            xLabel="Sản phẩm"
            yLabel="Số lượng"
            height={400}
          />
        )}
      </Card>
      <Divider />
    </Spin>
  );
};

export default AdminCard;
