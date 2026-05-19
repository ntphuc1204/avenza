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
} from "antd";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";
import { useEffect, useState } from "react";

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

  const onFinish = async (values: any) => {
    if (!session?.user?.access_token) {
      notification.warning({ message: "Vui lòng đăng nhập để thêm review" });
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
      notification.success({ message: "Cảm ơn bạn đã đánh giá sản phẩm" });
      loadReviews();
    } else {
      notification.error({ message: res?.message || "Gửi review thất bại" });
    }
  };

  return (
    <div style={{ marginTop: 24 }}>
      <Title level={4}>Đánh giá sản phẩm</Title>
      <List
        dataSource={reviews}
        loading={loading}
        locale={{ emptyText: "Chưa có đánh giá nào" }}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta
              title={item.user?.name || "Khách"}
              description={
                <Space direction="vertical">
                  <Rate disabled value={item.rating || 0} />
                  <Text>{item.comment}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />

      <div
        style={{
          marginTop: 24,
          padding: 20,
          background: "#ffffff",
          borderRadius: 12,
        }}
      >
        <Title level={5}>Viết đánh giá của bạn</Title>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Đánh giá"
            name="rating"
            initialValue={5}
            rules={[{ required: true, message: "Chọn số sao" }]}
          >
            <Rate />
          </Form.Item>
          <Form.Item label="Bình luận" name="comment">
            <Input.TextArea rows={4} placeholder="Nhập cảm nhận của bạn" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Gửi đánh giá
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ProductReviews;
