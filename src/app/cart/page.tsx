"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  List,
  Radio,
  Row,
  Space,
  Statistic,
  Typography,
  notification,
  Divider,
  Modal,
  Select,
  Tag,
} from "antd";
import { Tooltip } from "antd";
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

  const [myDiscounts, setMyDiscounts] = useState<any[]>([]);

  const [selectedDiscount, setSelectedDiscount] = useState<any>(null);

  const [discountLoading, setDiscountLoading] = useState(false);

  const discountAmount = selectedDiscount?.discountAmount || 0;

  const finalPrice = Math.max((cart?.totalPrice || 0) - discountAmount, 0);

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

  const loadMyDiscounts = async () => {
    if (!session?.user?.access_token) return;

    const res = await sendRequest<IBackendRes<any[]>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/discounts/mine`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    setMyDiscounts((res?.data || []).filter((item: any) => !item.isUsed));
  };

  useEffect(() => {
    loadCart();
    loadProfile();
    loadMyDiscounts();
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

    if (res?.data) {
      // reload lại cart chuẩn từ DB
      await loadCart();
      setSelectedDiscount(null);

      // update badge realtime
      window.dispatchEvent(new Event("cartUpdated"));
    }
  };

  const removeItem = async (productId: string) => {
    const res = await sendRequest<any>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/remove/${productId}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${session?.user?.access_token}`,
      },
    });

    if (res?.data) {
      await loadCart();
      setSelectedDiscount(null);

      window.dispatchEvent(new Event("cartUpdated"));
    }
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
    setSelectedDiscount(null);
  };

  const applyDiscount = async (code: string) => {
    if (!code || !cart?.items?.length) return;

    setDiscountLoading(true);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/discounts/preview`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.user?.access_token}`,
      },
      body: {
        code,
        totalPrice: cart.totalPrice,
        items: cart.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      },
    });

    setDiscountLoading(false);

    if (res?.data) {
      setSelectedDiscount(res.data);
      notification.success({
        message: `Đã áp dụng ${res.data.discount.code}`,
      });
    } else {
      setSelectedDiscount(null);
      notification.error({
        message: res?.message || "Voucher không hợp lệ",
      });
    }
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
          recipientName: userProfile?.name,
          phone: userProfile?.phone,
          address: userProfile?.address,
          note: values.note,
        },
        paymentMethod: "COD",
        discountCode: selectedDiscount?.discount?.code,
      },
    });
  };

  // ================= MOMO =================
  const handleMomoPayment = async (values: any) => {
    try {
      setCheckoutLoading(true);

      // payload order
      const orderData = {
        userId: userProfile?._id,

        products: cart.items.map((item: any) => ({
          productId: item.productId,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
        })),

        totalPrice: cart.totalPrice,

        discountAmount,

        finalPrice,

        discountCode: selectedDiscount?.discount?.code || null,

        shippingAddress: {
          recipientName: userProfile?.name,
          phone: userProfile?.phone,
          address: userProfile?.address,
          note: values.note || "",
        },

        paymentMethod: "MOMO",
      };

      // create momo payment
      const paymentRes = await sendRequest<any>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/payments/momo`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: {
          orderData,
          amount: finalPrice,
        },
      });

      const paymentUrl = paymentRes?.data?.paymentUrl;

      if (!paymentUrl) {
        throw new Error(
          paymentRes?.message || "Không tạo được URL thanh toán MoMo",
        );
      }

      // redirect momo
      window.location.href = paymentUrl;
    } catch (error: any) {
      console.log("MOMO ERROR:", error);

      Modal.error({
        title: "Thanh toán MoMo thất bại",
        content: error?.message || "Không thể kết nối tới cổng thanh toán MoMo",
      });

      setCheckoutLoading(false);
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

      <Row gutter={[24, 24]}>
        <Col xs={24} sm={24} md={24} lg={16} xl={16}>
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
                      <Space direction="vertical" style={{ width: "100%" }}>
                        <Space>
                          <Button
                            size="small"
                            disabled={item.quantity <= 1}
                            onClick={() =>
                              updateItem(item.productId, item.quantity - 1)
                            }
                          >
                            -
                          </Button>

                          <Text strong>{item.quantity}</Text>

                          <Tooltip
                            title={
                              item.quantity === item.stock
                                ? `Chỉ còn ${item.stock} sản phẩm`
                                : ""
                            }
                          >
                            <Button
                              size="small"
                              disabled={item.quantity >= item.stock}
                              onClick={() =>
                                updateItem(item.productId, item.quantity + 1)
                              }
                            >
                              +
                            </Button>
                          </Tooltip>
                        </Space>

                        <Space size={16}>
                          <Text type="secondary">
                            Giá: {Number(item.price).toLocaleString("vi-VN")} ₫
                          </Text>
                          <Text strong>
                            Thành tiền:{" "}
                            {(item.price * item.quantity).toLocaleString(
                              "vi-VN",
                            )}{" "}
                            ₫
                          </Text>
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            <Button danger block size="large" onClick={clearCart}>
              Xóa giỏ hàng
            </Button>
          </Card>
        </Col>

        <Col xs={24} sm={24} md={24} lg={8} xl={8}>
          <div
            style={{
              position: "sticky",
              top: 24,
            }}
          >
            <Card>
              <Statistic
                title="Tổng tiền"
                value={cart?.totalPrice || 0}
                suffix="₫"
              />

              <Divider />

              <Space direction="vertical" style={{ width: "100%" }}>
                <Text strong>Voucher</Text>
                <Select
                  allowClear
                  loading={discountLoading}
                  placeholder="Chọn voucher đã nhận"
                  style={{ width: "100%" }}
                  onChange={(code) => {
                    if (code) {
                      applyDiscount(code);
                    } else {
                      setSelectedDiscount(null);
                    }
                  }}
                  options={myDiscounts
                    .filter((item) => item.discountId)
                    .map((item) => ({
                      label: `${item.discountId.code} - ${item.discountId.title}`,
                      value: item.discountId.code,
                    }))}
                />
                <Button
                  type="link"
                  onClick={() => router.push("/my-discounts")}
                >
                  Xem voucher của tôi
                </Button>

                {selectedDiscount ? (
                  <div
                    style={{
                      background: "#fff7e6",
                      border: "1px solid #ffd591",
                      borderRadius: 12,
                      padding: 12,
                    }}
                  >
                    <Space direction="vertical" size={4}>
                      <Tag color="orange">{selectedDiscount.discount.code}</Tag>
                      <Text>
                        Giảm: {discountAmount.toLocaleString("vi-VN")} đ
                      </Text>
                      <Text strong>
                        Còn thanh toán: {finalPrice.toLocaleString("vi-VN")} đ
                      </Text>
                    </Space>
                  </div>
                ) : null}
              </Space>

              <Divider />

              <Form form={form} onFinish={onFinish} layout="vertical">
                <Form.Item label="Họ tên">
                  <Input value={userProfile?.name} disabled />
                </Form.Item>

                <Form.Item label="Số điện thoại">
                  <Input value={userProfile?.phone} disabled />
                </Form.Item>

                <Form.Item label="Địa chỉ">
                  <Input.TextArea
                    value={userProfile?.address}
                    disabled
                    autoSize={{ minRows: 2, maxRows: 4 }}
                  />
                </Form.Item>

                <Button
                  type="link"
                  style={{ padding: 0 }}
                  onClick={() => router.push("/profile")}
                >
                  Cập nhật thông tin
                </Button>

                <Form.Item name="paymentMethod" initialValue="COD">
                  <Radio.Group
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <Radio value="COD">COD</Radio>
                    <Radio value="MOMO">MoMo</Radio>
                  </Radio.Group>
                </Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={checkoutLoading}
                  disabled={isMissingProfile}
                  style={{
                    height: 48,
                    fontWeight: 600,
                  }}
                >
                  Đặt hàng
                </Button>
                {isMissingProfile && (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      background: "#fff2f0",
                      border: "1px solid #ffccc7",
                      borderRadius: 8,
                    }}
                  >
                    <Text type="danger">
                      Bạn cần cập nhật đầy đủ họ tên, số điện thoại và địa chỉ
                      trước khi đặt hàng.
                    </Text>

                    <br />

                    <Button
                      type="link"
                      style={{ padding: 0 }}
                      onClick={() => router.push("/profile")}
                    >
                      Cập nhật thông tin
                    </Button>
                  </div>
                )}
              </Form>
            </Card>
          </div>
        </Col>
      </Row>
    </GuestLayout>
  );
};

export default CartPage;
