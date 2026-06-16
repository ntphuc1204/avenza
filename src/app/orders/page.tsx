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
  Modal,
  Form,
  Select,
  Input,
  Tooltip,
  Tabs,
  Descriptions,
  List,
} from "antd";

import { CopyOutlined } from "@ant-design/icons";

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
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [cancelModal, setCancelModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [cancelLoading, setCancelLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [detailModal, setDetailModal] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<any>(null);
  const [cancelForm] = Form.useForm();

  const cancelReasons = [
    "Đặt nhầm sản phẩm",
    "Muốn thay đổi địa chỉ",
    "Tìm được giá tốt hơn",
    "Không còn nhu cầu",
    "Đặt trùng đơn hàng",
    "Khác",
  ];

  const PAYMENT_STATUS_LABEL: Record<string, string> = {
    PENDING: "Chờ thanh toán",
    SUCCESS: "Đã thanh toán",
    FAILED: "Thanh toán thất bại",
    REFUND_PENDING: "Đang hoàn tiền",
    REFUNDED: "Đã hoàn tiền",
  };

  const PAYMENT_STATUS_COLOR: Record<string, string> = {
    PENDING: "gold",
    SUCCESS: "green",
    FAILED: "red",
    REFUND_PENDING: "orange",
    REFUNDED: "cyan",
  };

  const loadOrders = async (q?: string) => {
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

      queryParams: {
        current: 1,
        pageSize: 20,
        ...(q ? { query: q } : searchQuery ? { query: searchQuery } : {}),
      },
    });

    setLoading(false);

    if (res?.data?.results) {
      setOrders(res.data.results);
    }
  };

  useEffect(() => {
    const init = async () => {
      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : null;
      const q = params?.get("query") || "";
      setSearchQuery(q);
      await loadOrders(q || undefined);
    };

    if (session) init();
  }, [session]);

  const handleCancelOrder = async (values: any) => {
    if (!selectedOrder) return;

    setCancelLoading(true);

    try {
      const res = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/${selectedOrder._id}/cancel`,

        method: "PUT",

        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
        },

        body: {
          cancelReason: values.reason,
          cancelMessage: values.message,
        },
      });

      setCancelLoading(false);

      if (res?.data || res) {
        notification.success({
          message: "Đã gửi yêu cầu hủy đơn hàng",
        });

        // UPDATE UI NGAY
        setOrders((prev) =>
          prev.map((item) =>
            item._id === selectedOrder._id
              ? {
                  ...item,
                  cancelStatus: "REQUESTED",
                  cancelReason: values.reason,
                  cancelMessage: values.message,
                }
              : item,
          ),
        );

        setCancelModal(false);

        cancelForm.resetFields();
      }
    } catch (error) {
      setCancelLoading(false);

      notification.error({
        message: "Không thể hủy đơn hàng",
      });
    }
  };

  const handleCopyOrderCode = async (orderId: string) => {
    try {
      const orderCode = orderId.slice(-8);
      await navigator.clipboard.writeText(orderCode);
      notification.success({
        message: "Đã sao chép mã đơn",
        description: `Mã: ${orderCode}`,
      });
    } catch (error) {
      notification.error({
        message: "Sao chép thất bại",
      });
    }
  };

  const getBadgeStatus = (
    orderStatus: string,
    cancelStatus?: string,
    paymentStatus?: string,
  ) => {
    if (cancelStatus === "REQUESTED") {
      return "warning";
    }

    if (paymentStatus === "REFUND_PENDING") {
      return "warning";
    }

    if (paymentStatus === "REFUNDED") {
      return "success";
    }

    switch (orderStatus) {
      case "DELIVERED":
        return "success";

      case "PENDING":
        return "processing";

      case "PROCESSING":
        return "processing";

      case "DELIVERING":
        return "processing";

      case "DELIVERY_FAILED":
        return "error";

      case "CANCELLED":
        return "error";

      default:
        return "default";
    }
  };

  const getStatusText = (
    orderStatus: string,
    cancelStatus?: string,
    paymentStatus?: string,
  ) => {
    if (cancelStatus === "REQUESTED") {
      return "ĐANG XÁC NHẬN HỦY";
    }

    if (paymentStatus === "REFUND_PENDING") {
      return "ĐANG HOÀN TIỀN";
    }

    if (paymentStatus === "REFUNDED") {
      return "ĐÃ HOÀN TIỀN";
    }

    switch (orderStatus) {
      case "PENDING":
        return "ĐANG CHỜ XỬ LÝ";

      case "PROCESSING":
        return "ĐANG XỬ LÝ";

      case "DELIVERING":
        return "ĐANG GIAO";

      case "DELIVERED":
        return "ĐÃ GIAO";

      case "DELIVERY_FAILED":
        return "GIAO HÀNG THẤT BẠI";

      case "CANCELLED":
        return "ĐÃ HỦY";

      default:
        return orderStatus;
    }
  };
  const activeOrders = orders.filter((order) =>
    ["PENDING", "PROCESSING", "DELIVERING"].includes(order.orderStatus),
  );

  const historyOrders = orders.filter((order) =>
    ["DELIVERED", "DELIVERY_FAILED", "CANCELLED"].includes(order.orderStatus),
  );

  const displayOrders = activeTab === "active" ? activeOrders : historyOrders;
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
      <div
        style={{
          marginBottom: 24,
        }}
      >
        <Title level={3}>Quản lý đơn hàng</Title>

        <Text type="secondary">
          Xem trạng thái đơn hàng, thanh toán và chi tiết giao hàng.
        </Text>
        <div style={{ marginTop: 12, maxWidth: 480 }}>
          <Input.Search
            placeholder="Tìm mã đơn (VD: 72f19871)"
            enterButton
            allowClear
            onSearch={(value) => {
              const q = (value || "").trim();
              setSearchQuery(q);
              loadOrders(q || undefined);
              if (q) {
                router.push(
                  `/orders?query=${encodeURIComponent(q)}&current=1&pageSize=20`,
                );
              } else {
                router.push("/orders");
              }
            }}
          />
        </div>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ marginTop: 20 }}
          items={[
            {
              key: "active",
              label: `Đơn chưa hoàn thành (${activeOrders.length})`,
            },
            {
              key: "history",
              label: `Lịch sử đặt hàng (${historyOrders.length})`,
            },
          ]}
        />
      </div>

      {displayOrders.length ? (
        <Card style={{ borderRadius: 20 }} bodyStyle={{ padding: 0 }}>
          <List
            loading={loading}
            itemLayout="vertical"
            dataSource={displayOrders}
            renderItem={(order) => {
              const products = order?.products ?? [];

              return (
                <List.Item
                  key={order._id}
                  onClick={() => {
                    setSelectedDetail(order);
                    setDetailModal(true);
                  }}
                  style={{
                    padding: 20,
                    cursor: "pointer",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text strong>Đơn hàng #{order._id.slice(-8)}</Text>

                      <Button
                        type="text"
                        size="small"
                        icon={<CopyOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyOrderCode(order._id);
                        }}
                      />
                    </div>

                    <Badge
                      status={getBadgeStatus(
                        order.orderStatus,
                        order.cancelStatus,
                        order.paymentStatus,
                      )}
                      text={getStatusText(
                        order.orderStatus,
                        order.cancelStatus,
                        order.paymentStatus,
                      )}
                    />
                  </div>

                  {/* Sản phẩm */}
                  <div
                    style={{
                      marginBottom: 12,
                    }}
                  >
                    {products.slice(0, 3).map((item: any) => (
                      <div
                        key={item.productId}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <Text>{item.name}</Text>

                        <Text>
                          {item.quantity} ×{" "}
                          {Number(item.price).toLocaleString("vi-VN")} ₫
                        </Text>
                      </div>
                    ))}

                    {products.length > 3 && (
                      <Text type="secondary">
                        Và {products.length - 3} sản phẩm khác...
                      </Text>
                    )}
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <Text type="secondary">
                        {new Date(order.createdAt).toLocaleString("vi-VN")}
                      </Text>

                      <br />

                      <Tag
                        color={
                          PAYMENT_STATUS_COLOR[order.paymentStatus] || "gold"
                        }
                      >
                        {PAYMENT_STATUS_LABEL[order.paymentStatus] ||
                          order.paymentStatus}
                      </Tag>
                    </div>

                    <div
                      style={{
                        textAlign: "right",
                      }}
                    >
                      <Text strong>
                        {Number(
                          order.finalPrice || order.totalPrice,
                        ).toLocaleString("vi-VN")}{" "}
                        ₫
                      </Text>

                      <br />

                      {["PENDING", "PROCESSING"].includes(order.orderStatus) &&
                        order.cancelStatus !== "REQUESTED" && (
                          <Button
                            danger
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrder(order);
                              setCancelModal(true);
                            }}
                          >
                            Hủy đơn
                          </Button>
                        )}
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        </Card>
      ) : (
        <Card
          style={{
            borderRadius: 20,

            background: "#ffffff",
          }}
          loading={loading}
        >
          <Empty description="Chưa có đơn hàng" />
        </Card>
      )}
      <Modal
        title={`Chi tiết đơn #${selectedDetail?._id?.slice(-8)}`}
        open={detailModal}
        footer={null}
        width={900}
        onCancel={() => setDetailModal(false)}
      >
        {selectedDetail && (
          <>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Mã đơn">
                {selectedDetail._id}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái">
                {getStatusText(
                  selectedDetail.orderStatus,
                  selectedDetail.cancelStatus,
                  selectedDetail.paymentStatus,
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Thanh toán">
                {PAYMENT_STATUS_LABEL[selectedDetail.paymentStatus]}
              </Descriptions.Item>

              <Descriptions.Item label="Tổng tiền">
                {Number(
                  selectedDetail.finalPrice || selectedDetail.totalPrice,
                ).toLocaleString("vi-VN")}{" "}
                ₫
              </Descriptions.Item>

              <Descriptions.Item label="Ngày đặt">
                {new Date(selectedDetail.createdAt).toLocaleString("vi-VN")}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Danh sách sản phẩm</Title>

            {selectedDetail.products?.map((item: any, index: number) => (
              <Card key={index} size="small" style={{ marginBottom: 10 }}>
                <Row justify="space-between">
                  <Col>
                    <strong>{item.name}</strong>
                  </Col>

                  <Col>
                    {item.quantity} x{" "}
                    {Number(item.price).toLocaleString("vi-VN")} ₫
                  </Col>
                </Row>
              </Card>
            ))}

            {(selectedDetail.cancelStatus === "REQUESTED" ||
              selectedDetail.orderStatus === "CANCELLED") && (
              <>
                <Divider />

                <Card
                  size="small"
                  style={{
                    background:
                      selectedDetail.orderStatus === "CANCELLED"
                        ? "#fff2f0"
                        : "#fffbe6",
                  }}
                >
                  <Text strong>Lý do hủy:</Text>

                  <br />

                  <Text>{selectedDetail.cancelReason || "Không có lý do"}</Text>

                  {selectedDetail.cancelMessage && (
                    <>
                      <br />
                      <br />

                      <Text strong>Ghi chú:</Text>

                      <br />

                      <Text>{selectedDetail.cancelMessage}</Text>
                    </>
                  )}
                </Card>
              </>
            )}
          </>
        )}
      </Modal>
      <Modal
        title="Hủy đơn hàng"
        open={cancelModal}
        onCancel={() => setCancelModal(false)}
        footer={null}
      >
        <Form layout="vertical" form={cancelForm} onFinish={handleCancelOrder}>
          <Form.Item
            label="Lý do hủy"
            name="reason"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn lý do",
              },
            ]}
          >
            <Select
              options={cancelReasons.map((item) => ({
                label: item,
                value: item,
              }))}
            />
          </Form.Item>

          <Form.Item label="Ghi chú" name="message">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Button
            danger
            type="primary"
            htmlType="submit"
            loading={cancelLoading}
            block
          >
            Xác nhận hủy đơn
          </Button>
        </Form>
      </Modal>
    </GuestLayout>
  );
};

export default OrdersPage;
