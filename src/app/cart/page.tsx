"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  List,
  Radio,
  Row,
  Space,
  Statistic,
  Typography,
  notification,
  Divider,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";
import { sendRequest } from "@/utils/api";

const { Title, Text } = Typography;

const CartPage = () => {
  const { data: session } = useSession();

  const router = useRouter();

  const [form] = Form.useForm();

  const [cart, setCart] = useState<any>(null);

  const [userProfile, setUserProfile] = useState<any>(null);

  const [loading, setLoading] = useState(false);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState("COD");

  const loadProfile = async () => {
    if (!session?.user?.access_token) return;

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/account`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    const profileData = res?.data?.user ?? res?.data;

    if (profileData) {
      setUserProfile(profileData);

      form.setFieldsValue({
        recipientName: profileData.name || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        paymentMethod: "COD",
      });
    }
  };

  const loadCart = async () => {
    if (!session?.user?.access_token) return;

    setLoading(true);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    setLoading(false);

    if (res?.data) {
      setCart(res.data);
    }
  };

  useEffect(() => {
    loadCart();
    loadProfile();
  }, [session]);

  const isMissingProfile = useMemo(() => {
    if (!userProfile) return false;

    return !userProfile?.name || !userProfile?.phone || !userProfile?.address;
  }, [userProfile]);

  const updateItem = async (productId: string, quantity: number) => {
    if (!session?.user?.access_token) return;

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/update`,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
      body: { productId, quantity },
    });

    if (res?.data) {
      setCart(res.data);
    }
  };

  const removeItem = async (productId: string) => {
    if (!session?.user?.access_token) return;

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/remove/${productId}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    if (res?.data) {
      setCart(res.data);
    }
  };

  const clearCart = async () => {
    if (!session?.user?.access_token) return;

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/clear`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    if (res?.data) {
      setCart(res.data);
    }
  };

  const onFinish = async (values: any) => {
    if (!session?.user?.access_token) {
      router.push("/auth/login");
      return;
    }

    if (isMissingProfile) {
      notification.warning({
        message: "Vui lòng cập nhật đầy đủ thông tin cá nhân",
      });

      router.push("/profile");
      return;
    }

    if (!cart?.items?.length) {
      notification.warning({ message: "Giỏ hàng trống" });
      return;
    }

    setCheckoutLoading(true);

    const orderRes = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
      body: {
        products: cart.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          recipientName: values.recipientName,
          phone: values.phone,
          address: values.address,
          note: values.note,
        },
        paymentMethod: values.paymentMethod,
      },
    });

    if (!orderRes?.data) {
      setCheckoutLoading(false);

      notification.error({
        message: orderRes?.message || "Thanh toán thất bại",
      });

      return;
    }

    if (values.paymentMethod === "VNPAY") {
      const paymentRes = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/payments/vnpay`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        body: {
          orderId: orderRes.data._id,
          amount: orderRes.data.totalPrice,
        },
      });

      setCheckoutLoading(false);

      if (paymentRes?.data?.paymentUrl) {
        window.location.href = paymentRes.data.paymentUrl;
        return;
      }

      notification.error({
        message: paymentRes?.message || "Không thể tạo yêu cầu VNPay",
      });

      return;
    }

    setCheckoutLoading(false);

    notification.success({
      message: "Đã tạo đơn hàng thành công",
    });

    router.push("/orders");
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
          <Title level={3}>Bạn cần đăng nhập để xem giỏ hàng</Title>

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
        <Title level={3}>Giỏ hàng của bạn</Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card style={{ borderRadius: 20 }} loading={loading}>
            <Title level={4}>Mặt hàng</Title>

            <List
              dataSource={cart?.items || []}
              locale={{
                emptyText: "Giỏ hàng của bạn hiện đang trống",
              }}
              renderItem={(item: any) => (
                <List.Item
                  actions={[
                    <Button
                      key="remove"
                      type="link"
                      danger
                      onClick={() => removeItem(item.productId)}
                    >
                      Xóa
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space direction="vertical">
                        <Text>
                          Giá: {Number(item.price).toLocaleString("vi-VN")} ₫
                        </Text>

                        <Space>
                          <Text>Số lượng:</Text>

                          <InputNumber
                            min={1}
                            max={item.stock || 100}
                            value={item.quantity}
                            onChange={(value) =>
                              updateItem(item.productId, Number(value))
                            }
                          />
                        </Space>
                      </Space>
                    }
                  />

                  <Text strong>
                    {(item.price * item.quantity).toLocaleString("vi-VN")} ₫
                  </Text>
                </List.Item>
              )}
            />

            {cart?.items?.length ? (
              <div
                style={{
                  marginTop: 24,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button danger onClick={clearCart}>
                  Xóa toàn bộ giỏ hàng
                </Button>
              </div>
            ) : null}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ borderRadius: 20 }}>
            <Title level={4}>Thanh toán</Title>

            <Space direction="vertical" size={16} style={{ width: "100%" }}>
              <Statistic
                title="Tổng tiền"
                value={cart?.totalPrice || 0}
                suffix="₫"
              />

              <Divider />

              {isMissingProfile && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 12,
                    background: "#fff7e6",
                    border: "1px solid #ffd591",
                  }}
                >
                  <Text>Bạn chưa cập nhật đầy đủ thông tin cá nhân.</Text>

                  <div style={{ marginTop: 10 }}>
                    <Button
                      type="primary"
                      onClick={() => router.push("/profile")}
                    >
                      Cập nhật thông tin
                    </Button>
                  </div>
                </div>
              )}

              <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                  name="recipientName"
                  label="Tên người nhận"
                  rules={[
                    {
                      required: true,
                      message: "Nhập tên người nhận",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                  rules={[
                    {
                      required: true,
                      message: "Nhập số điện thoại",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="address"
                  label="Địa chỉ giao hàng"
                  rules={[
                    {
                      required: true,
                      message: "Nhập địa chỉ giao hàng",
                    },
                  ]}
                >
                  <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="note" label="Ghi chú">
                  <Input.TextArea rows={2} />
                </Form.Item>

                <Form.Item
                  name="paymentMethod"
                  label="Phương thức thanh toán"
                  initialValue="COD"
                  rules={[{ required: true }]}
                >
                  <Radio.Group
                    onChange={(event) => setPaymentMethod(event.target.value)}
                    value={paymentMethod}
                  >
                    <Space direction="vertical">
                      <Radio value="COD">Thanh toán khi nhận hàng (COD)</Radio>

                      <Radio value="VNPAY">Thanh toán VNPay</Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                {paymentMethod === "VNPAY" ? (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: "#f7fbff",
                      border: "1px solid #d6e4ff",
                      marginBottom: 16,
                    }}
                  >
                    <Text type="secondary">
                      Bạn sẽ được chuyển đến cổng thanh toán VNPay để hoàn tất
                      giao dịch.
                    </Text>
                  </div>
                ) : null}

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={checkoutLoading}
                    disabled={!cart?.items?.length}
                  >
                    Đặt hàng
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        </Col>
      </Row>
    </GuestLayout>
  );
};

export default CartPage;
