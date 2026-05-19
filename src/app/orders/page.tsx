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

  const [cancelModal, setCancelModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [cancelLoading, setCancelLoading] = useState(false);

  const [cancelForm] = Form.useForm();

  const cancelReasons = [
    "Đặt nhầm sản phẩm",
    "Muốn thay đổi địa chỉ",
    "Tìm được giá tốt hơn",
    "Không còn nhu cầu",
    "Đặt trùng đơn hàng",
    "Khác",
  ];

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

      queryParams: {
        current: 1,
        pageSize: 20,
      },
    });

    setLoading(false);

    if (res?.data?.results) {
      setOrders(res.data.results);
    }
  };

  useEffect(() => {
    loadOrders();
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

  const getBadgeStatus = (orderStatus: string, cancelStatus?: string) => {
    if (cancelStatus === "REQUESTED") {
      return "warning";
    }

    switch (orderStatus) {
      case "DELIVERED":
        return "success";

      case "PENDING":
        return "processing";

      case "CANCELLED":
        return "error";

      default:
        return "default";
    }
  };

  const getStatusText = (orderStatus: string, cancelStatus?: string) => {
    if (cancelStatus === "REQUESTED") {
      return "ĐANG XÁC NHẬN HỦY";
    }

    switch (orderStatus) {
      case "PENDING":
        return "ĐANG CHỜ XÁC NHẬN";

      case "PROCESSING":
        return "ĐANG XỬ LÝ";

      case "DELIVERING":
        return "ĐANG GIAO";

      case "DELIVERED":
        return "ĐÃ GIAO";

      case "CANCELLED":
        return "ĐÃ HỦY";

      default:
        return orderStatus;
    }
  };

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
      </div>

      {orders.length ? (
        <Row gutter={[24, 24]}>
          {orders.map((order) => {
            const isCancelled = order.orderStatus === "CANCELLED";

            return (
              <Col key={order._id} xs={24} md={12}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 20,
                    opacity: isCancelled ? 0.6 : 1,
                    filter: isCancelled ? "grayscale(20%)" : "none",
                    transition: "0.3s",
                    border:
                      order.orderStatus === "CANCEL_REQUEST"
                        ? "1px solid #faad14"
                        : undefined,
                  }}
                >
                  <Space
                    direction="vertical"
                    size={12}
                    style={{
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",

                        justifyContent: "space-between",

                        alignItems: "center",
                      }}
                    >
                      <Text strong>Đơn hàng #{order._id.slice(-6)}</Text>

                      <Badge
                        status={getBadgeStatus(
                          order.orderStatus,
                          order.cancelStatus,
                        )}
                        text={getStatusText(
                          order.orderStatus,
                          order.cancelStatus,
                        )}
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
                      Giá trị:{" "}
                      {Number(order.totalPrice).toLocaleString("vi-VN")} ₫
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

                    <Divider />

                    <Space wrap>
                      {/* CHƯA GỬI YÊU CẦU HỦY */}
                      {order.orderStatus === "PENDING" &&
                        order.cancelStatus !== "REQUESTED" && (
                          <Button
                            danger
                            onClick={() => {
                              setSelectedOrder(order);

                              setCancelModal(true);
                            }}
                          >
                            Hủy đơn hàng
                          </Button>
                        )}

                      {/* ĐANG CHỜ ADMIN XÁC NHẬN */}
                      {order.cancelStatus === "REQUESTED" && (
                        <Button
                          style={{
                            background: "#faad14",
                            borderColor: "#faad14",
                            color: "#fff",
                          }}
                          disabled
                          loading
                        >
                          Đang xác nhận hủy đơn
                        </Button>
                      )}

                      {/* ĐÃ HỦY */}
                      {order.orderStatus === "CANCELLED" && (
                        <Tag color="red">Đơn hàng đã hủy</Tag>
                      )}
                    </Space>
                    {(order.cancelStatus === "REQUESTED" ||
                      order.orderStatus === "CANCELLED") && (
                      <Card
                        size="small"
                        style={{
                          background:
                            order.orderStatus === "CANCELLED"
                              ? "#fff2f0"
                              : "#fffbe6",

                          borderColor:
                            order.orderStatus === "CANCELLED"
                              ? "#ffccc7"
                              : "#ffe58f",
                        }}
                      >
                        <Text strong>Lý do hủy:</Text>

                        <br />

                        <Text>{order.cancelReason || "Không có lý do"}</Text>

                        {order.cancelMessage && (
                          <>
                            <br />
                            <br />

                            <Text strong>Ghi chú:</Text>

                            <br />

                            <Text>{order.cancelMessage}</Text>
                          </>
                        )}
                      </Card>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
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
