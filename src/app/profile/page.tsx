"use client";

import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  notification,
  Row,
  Space,
  Spin,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";
import { sendRequest } from "@/utils/api";

const { Title, Text } = Typography;

const ProfilePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  const accessToken = session?.user?.access_token;

  useEffect(() => {
    if (status !== "authenticated") return;
    loadProfile();
  }, [status, accessToken]);

  const loadProfile = async () => {
    if (!accessToken) return;
    setLoading(true);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/profile`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setLoading(false);

    if (res?.data) {
      setProfile(res.data);
      form.setFieldsValue({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
      });
    }
  };

  const handleSaveProfile = async (values: any) => {
    if (!accessToken) {
      router.push("/auth/login");
      return;
    }

    setSaving(true);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/profile`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        name: values.name?.trim(),
        phone: values.phone?.trim(),
        address: values.address?.trim(),
      },
    });

    setSaving(false);

    if (res?.data) {
      notification.success({
        message: "Cập nhật thông tin thành công",
      });
      setProfile(res.data);
      form.setFieldsValue({
        name: res.data.name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        address: res.data.address || "",
      });
    } else {
      notification.error({
        message: res?.message || "Cập nhật thông tin thất bại",
      });
    }
  };

  const handleChangePassword = async (values: any) => {
    if (!accessToken) {
      router.push("/auth/login");
      return;
    }

    setPasswordLoading(true);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/auth/profile/password`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
        confirmPassword: values.confirmPassword,
      },
    });

    setPasswordLoading(false);

    if (res?.data) {
      notification.success({
        message: "Đổi mật khẩu thành công",
      });
      passwordForm.resetFields();
    } else {
      notification.error({
        message: res?.message || "Đổi mật khẩu thất bại",
      });
    }
  };

  if (status === "loading") {
    return (
      <GuestLayout>
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" />
        </div>
      </GuestLayout>
    );
  }

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
          <Title level={3}>Bạn cần đăng nhập để xem trang hồ sơ</Title>
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
        <Title level={3}>Thông tin cá nhân</Title>
        <Text>
          Nếu bạn muốn thay đổi mật khẩu hoặc cập nhật địa chỉ, vui lòng sử dụng
          form bên dưới.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 20 }} loading={loading}>
            <Title level={4}>Cập nhật thông tin</Title>
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveProfile}
              validateTrigger={["onBlur", "onSubmit"]}
              scrollToFirstError
              initialValues={{
                name: profile?.name || "",
                email: profile?.email || "",
                phone: profile?.phone || "",
                address: profile?.address || "",
              }}
            >
              <Form.Item label="Email" name="email">
                <Input disabled />
              </Form.Item>

              <Form.Item
                label="Họ và tên"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập họ tên",
                  },
                  {
                    validator: (_, value) => {
                      if (!value || value.trim().length >= 2) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error("Họ tên phải có ít nhất 2 ký tự"),
                      );
                    },
                  },
                ]}
              >
                <Input placeholder="Nhập họ và tên" />
              </Form.Item>

              <Form.Item
                label="Số điện thoại"
                name="phone"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập số điện thoại",
                  },
                  {
                    pattern: /^(0(3|5|7|8|9))[0-9]{8}$/,
                    message: "Số điện thoại không hợp lệ",
                  },
                ]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>

              <Form.Item
                label="Địa chỉ"
                name="address"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập địa chỉ",
                  },
                ]}
              >
                <Input.TextArea rows={4} placeholder="Nhập địa chỉ" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={saving}>
                  Lưu thông tin
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 20 }}>
            <Title level={4}>Đổi mật khẩu</Title>
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              validateTrigger={["onBlur", "onSubmit"]}
              scrollToFirstError
            >
              <Form.Item
                label="Mật khẩu hiện tại"
                name="currentPassword"
                rules={[{ required: true, message: "Nhập mật khẩu hiện tại" }]}
              >
                <Input.Password placeholder="Mật khẩu hiện tại" />
              </Form.Item>

              <Form.Item
                label="Mật khẩu mới"
                name="newPassword"
                rules={[
                  {
                    required: true,
                    message: "Nhập mật khẩu mới",
                  },
                  {
                    min: 8,
                    message: "Mật khẩu tối thiểu 8 ký tự",
                  },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message: "Mật khẩu phải chứa chữ hoa, chữ thường và số",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (
                        !value ||
                        value !== getFieldValue("currentPassword")
                      ) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error(
                          "Mật khẩu mới không được trùng mật khẩu hiện tại",
                        ),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Mật khẩu mới" />
              </Form.Item>

              <Form.Item
                label="Xác nhận mật khẩu mới"
                name="confirmPassword"
                dependencies={["newPassword"]}
                rules={[
                  {
                    required: true,
                    message: "Xác nhận mật khẩu mới",
                  },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("newPassword") === value) {
                        return Promise.resolve();
                      }

                      return Promise.reject(
                        new Error("Mật khẩu xác nhận không khớp"),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Xác nhận mật khẩu mới" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={passwordLoading}
                >
                  Đổi mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card style={{ borderRadius: 20 }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text strong>Ghi chú</Text>
          <Text type="secondary">
            Email của bạn không thể thay đổi tại đây. Nếu bạn cần thay đổi
            email, liên hệ bộ phận hỗ trợ.
          </Text>
        </Space>
      </Card>
    </GuestLayout>
  );
};

export default ProfilePage;
