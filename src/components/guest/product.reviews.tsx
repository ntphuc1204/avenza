"use client";

import {
  Button,
  Form,
  Input,
  List,
  Rate,
  Space,
  Typography,
  notification,
  Avatar,
  Card,
} from "antd";

import { UserOutlined, MessageOutlined } from "@ant-design/icons";

import { useSession } from "next-auth/react";

import { sendRequest } from "@/utils/api";

import { useEffect, useMemo, useState } from "react";

const { Title, Text } = Typography;

interface IProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: IProductReviewsProps) => {
  const { data: session } = useSession();

  const [reviews, setReviews] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const loadReviews = async () => {
    setLoading(true);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reviews`,
      method: "GET",
      queryParams: { productId },
    });

    setLoading(false);

    if (res?.data) {
      const reviewsData = Array.isArray(res.data)
        ? res.data
        : res.data.results || [];

      setReviews(reviewsData);
    }
  };

  useEffect(() => {
    if (productId) {
      loadReviews();
    }
  }, [productId]);

  // =========================
  // CHỈ LẤY 2 ĐÁNH GIÁ MỚI NHẤT
  // =========================
  const latestReviews = useMemo(() => {
    return [...reviews]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime(),
      )
      .slice(0, 2);
  }, [reviews]);

  const onFinish = async (values: any) => {
    if (!session?.user?.access_token) {
      notification.warning({
        message: "Vui lòng đăng nhập để thêm review",
      });

      return;
    }

    setSubmitting(true);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reviews`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
      body: {
        productId,
        rating: values.rating,
        comment: values.comment,
      },
    });

    setSubmitting(false);

    if (res?.data) {
      notification.success({
        message: "Cảm ơn bạn đã đánh giá sản phẩm",
      });

      loadReviews();
    } else {
      notification.error({
        message: res?.message || "Gửi review thất bại",
      });
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div
        style={{
          marginBottom: 20,
        }}
      >
        <Title level={4} style={{ marginBottom: 4 }}>
          Đánh giá sản phẩm
        </Title>

        <Text type="secondary">Hiển thị 2 đánh giá mới nhất từ khách hàng</Text>
      </div>

      <List
        dataSource={latestReviews}
        loading={loading}
        locale={{
          emptyText: "Chưa có đánh giá nào",
        }}
        renderItem={(item) => (
          <Card
            key={item._id}
            style={{
              marginBottom: 16,
              borderRadius: 16,
              boxShadow: "0 6px 24px rgba(0,0,0,0.06)",
              border: "1px solid rgba(0,0,0,0.04)",
            }}
            bodyStyle={{
              padding: 20,
            }}
          >
            <List.Item
              style={{
                padding: 0,
                border: "none",
              }}
            >
              <List.Item.Meta
                avatar={<Avatar size={48} icon={<UserOutlined />} />}
                title={
                  <Space direction="vertical" size={2}>
                    <Text strong style={{ fontSize: 15 }}>
                      {item.user?.name || "Khách hàng"}
                    </Text>

                    <Rate
                      disabled
                      value={item.rating || 0}
                      style={{ fontSize: 16 }}
                    />
                  </Space>
                }
                description={
                  <Space
                    direction="vertical"
                    size={10}
                    style={{ marginTop: 10 }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        lineHeight: 1.7,
                      }}
                    >
                      <MessageOutlined
                        style={{
                          marginRight: 8,
                        }}
                      />
                      {item.comment || "Không có bình luận"}
                    </Text>

                    <Text
                      type="secondary"
                      style={{
                        fontSize: 12,
                      }}
                    >
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString("vi-VN")
                        : ""}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          </Card>
        )}
      />

      {/* FORM REVIEW */}
      <div
        style={{
          marginTop: 24,
          padding: 24,
          background: "#ffffff",
          borderRadius: 16,
          boxShadow: "0 8px 28px rgba(0,0,0,0.05)",
          border: "1px solid rgba(0,0,0,0.04)",
        }}
      >
        <Title level={5}>Viết đánh giá của bạn</Title>

        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Đánh giá"
            name="rating"
            initialValue={5}
            rules={[
              {
                required: true,
                message: "Chọn số sao",
              },
            ]}
          >
            <Rate />
          </Form.Item>

          <Form.Item label="Bình luận" name="comment">
            <Input.TextArea rows={4} placeholder="Nhập cảm nhận của bạn" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              style={{
                borderRadius: 10,
                height: 42,
                paddingInline: 24,
              }}
            >
              Gửi đánh giá
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ProductReviews;
