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
  Modal,
} from "antd";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import GuestLayout from "@/components/layout/guest.layout";
import { getAccount, sendRequest } from "@/utils/api";

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

  // ================= PROFILE =================
  const loadProfile = async () => {
    if (!session?.user?.access_token) return;

    const res = await getAccount<any>({
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    const profileData = res?.data?.user ?? res?.data ?? res;

    if (profileData) {
      setUserProfile(profileData);

      const profileValues = {
        recipientName: profileData.name || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        paymentMethod: "COD",
      };

      form.setFieldsValue(profileValues);
    }
  };

  // ================= CART =================
  const loadCart = async () => {
    if (!session?.user?.access_token) return;

    setLoading(true);

    const res = await sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    setLoading(false);
    setCart(res?.data ?? res);
  };

  useEffect(() => {
    loadCart();
    loadProfile();
  }, [session]);

  // ================= CHECK PROFILE =================
  const isMissingProfile = useMemo(() => {
    if (!userProfile) return true;
    return !userProfile?.name || !userProfile?.phone || !userProfile?.address;
  }, [userProfile]);

  // ================= UPDATE CART =================
  const updateItem = async (productId: string, quantity: number) => {
    const res = await sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/update`,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${session?.user?.access_token}`,
      },
      body: { productId, quantity },
    });

    setCart(res?.data ?? res);
  };

  const removeItem = async (productId: string) => {
    const res = await sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/remove/${productId}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session?.user?.access_token}`,
      },
    });

    setCart(res?.data ?? res);
  };

  const clearCart = async () => {
    const res = await sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/clear`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session?.user?.access_token}`,
      },
    });

    setCart(res?.data ?? res);
  };

  // ================= ORDER =================
  const createOrderCOD = async (values: any) => {
    return await sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.user?.access_token}`,
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
        paymentMethod: "COD",
      },
    });
  };

  // ================= MOMO =================
  const handleMomoPayment = async (values: any) => {
    try {
      setCheckoutLoading(true);

      const paymentRes = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/payments/momo`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: {
          orderData: {
            userId: userProfile?._id,
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
          },
          amount: cart.totalPrice,
        },
      });

      const paymentUrl = paymentRes?.data?.paymentUrl;

      if (!paymentUrl) {
        throw new Error(paymentRes?.message || "Không tạo được MoMo URL");
      }

      window.location.href = paymentUrl;
      return;
    } catch (err: any) {
      setCheckoutLoading(false);

      Modal.error({
        title: "Thanh toán MoMo thất bại",
        content: err?.message || "Không thể kết nối tới cổng thanh toán MoMo",
      });

      return;
    }
  };

  // ================= SUBMIT =================
  const onFinish = async (values: any) => {
    if (!session?.user?.access_token) {
      router.push("/auth/login");
      return;
    }

    if (!userProfile || isMissingProfile) {
      notification.error({
        message: "Thiếu thông tin người dùng",
      });
      router.push("/profile");
      return;
    }

    if (!cart?.items?.length) {
      notification.warning({
        message: "Giỏ hàng trống",
      });
      return;
    }

    setCheckoutLoading(true);

    try {
      // ================= MOMO =================
      if (values.paymentMethod === "MOMO") {
        await handleMomoPayment(values);
        return;
      }

      // ================= COD =================
      const orderRes = await createOrderCOD(values);

      if (!orderRes?.data?._id && !orderRes?._id) {
        throw new Error(orderRes?.message || "Tạo đơn hàng thất bại");
      }

      notification.success({
        message: "Đặt hàng thành công",
      });

      router.push("/orders");
    } catch (error: any) {
      Modal.error({
        title: "Lỗi đặt hàng",
        content: error?.message || "Có lỗi xảy ra",
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ================= UI =================
  if (!session) {
    return (
      <GuestLayout>
        <div style={{ textAlign: "center", padding: 40 }}>
          <Title level={3}>Bạn cần đăng nhập</Title>
          <Button onClick={() => router.push("/auth/login")}>Đăng nhập</Button>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <Title level={3}>Giỏ hàng</Title>

      <Row gutter={24}>
        <Col span={16}>
          <Card loading={loading}>
            <List
              dataSource={cart?.items || []}
              renderItem={(item: any) => (
                <List.Item
                  actions={[
                    <Button danger onClick={() => removeItem(item.productId)}>
                      Xóa
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={item.name}
                    description={
                      <Space>
                        <InputNumber
                          min={1}
                          value={item.quantity}
                          onChange={(v) =>
                            updateItem(item.productId, Number(v))
                          }
                        />
                        <Text>{item.price.toLocaleString("vi-VN")} ₫</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />

            <Button danger onClick={clearCart}>
              Xóa giỏ hàng
            </Button>
          </Card>
        </Col>

        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng tiền"
              value={cart?.totalPrice || 0}
              suffix="₫"
            />

            <Form form={form} onFinish={onFinish}>
              <Form.Item name="recipientName" rules={[{ required: true }]}>
                <Input placeholder="Tên người nhận" />
              </Form.Item>

              <Form.Item name="phone" rules={[{ required: true }]}>
                <Input placeholder="Số điện thoại" />
              </Form.Item>

              <Form.Item name="address" rules={[{ required: true }]}>
                <Input.TextArea placeholder="Địa chỉ" />
              </Form.Item>

              <Form.Item name="paymentMethod" initialValue="COD">
                <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)}>
                  <Radio value="COD">COD</Radio>
                  <Radio value="MOMO">MoMo</Radio>
                </Radio.Group>
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                loading={checkoutLoading}
              >
                Đặt hàng
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </GuestLayout>
  );
};

export default CartPage;
