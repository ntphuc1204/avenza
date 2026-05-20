"use client";

import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Image,
  InputNumber,
  Rate,
  Row,
  Skeleton,
  Space,
  Typography,
  notification,
} from "antd";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";
import ProductCard from "@/components/guest/product.card";
import ProductReviews from "@/components/guest/product.reviews";
import { sendRequest } from "@/utils/api";
import Link from "next/link";
import { useSession } from "next-auth/react";

const { Title, Text, Paragraph } = Typography;

const ProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const productId = params?.id as string;

  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/${productId}`,
        method: "GET",
      });

      if (res?.data) {
        setProduct(res.data);
      } else {
        setProduct(null);
        setError(res?.message || "Không tìm thấy sản phẩm");
      }
    } catch (err) {
      setProduct(null);
      setError("Lỗi khi tải sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const loadRelated = async () => {
    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/related/${productId}`,
        method: "GET",
      });

      if (res?.data) setRelated(res.data);
      else setRelated([]);
    } catch (err) {
      setRelated([]);
    }
  };

  useEffect(() => {
    if (productId) loadProduct();
  }, [productId]);

  useEffect(() => {
    if (product) loadRelated();
  }, [product]);

  const addToCart = async () => {
    if (!session?.user?.access_token) {
      router.push("/auth/login");
      return;
    }

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/add`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
      body: {
        productId,
        quantity,
      },
    });

    if (res?.data) {
      notification.success({ message: "Đã thêm sản phẩm vào giỏ hàng" });
    } else {
      notification.error({
        message: res?.message || "Thêm vào giỏ hàng thất bại",
      });
    }
  };

  if (!productId) {
    return (
      <GuestLayout>
        <Empty description="Sản phẩm không tồn tại" />
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <div style={{ marginBottom: 20 }}>
        <Link href="/">
          <Button type="link">← Quay lại trang chủ</Button>
        </Link>
      </div>

      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : error || !product ? (
        <Empty description={error || "Sản phẩm không tồn tại"} />
      ) : (
        <Row gutter={[16, 16]}>
          {/* LEFT IMAGE */}
          <Col xs={24} md={12}>
            <Card
              style={{ borderRadius: 16 }}
              styles={{ body: { padding: 8 } }}
            >
              <div
                style={{
                  background: "#fafafa",
                  padding: 12,
                  minHeight: 280,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Image
                  src={product.images?.[0] || "/placeholder.png"}
                  alt={product.name}
                  style={{
                    width: "100%",
                    maxWidth: 420,
                    height: "auto",
                    objectFit: "contain",
                  }}
                />
              </div>
            </Card>
          </Col>

          {/* RIGHT INFO */}
          <Col xs={24} md={12}>
            <div
              style={{
                background: "#fff",
                padding: 16,
                borderRadius: 16,
              }}
            >
              <Title level={3} style={{ fontSize: 20, marginBottom: 8 }}>
                {product.name}
              </Title>

              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                <Text type="secondary">
                  {product.categoryId?.name || "Danh mục không xác định"}
                </Text>

                <Rate allowHalf disabled value={Number(product.rating) || 0} />

                <Text style={{ fontSize: 24, color: "#1677ff" }}>
                  {Number(product.price).toLocaleString("vi-VN")} ₫
                </Text>

                <Text type={product.stock > 0 ? "success" : "danger"}>
                  {product.stock > 0
                    ? `Còn ${product.stock} sản phẩm`
                    : "Hết hàng"}
                </Text>

                <Paragraph style={{ fontSize: 13 }}>
                  {product.description ||
                    "Không có mô tả chi tiết cho sản phẩm này."}
                </Paragraph>

                {/* QUANTITY */}
                <Space
                  wrap
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <Text>Số lượng:</Text>
                  <InputNumber
                    min={1}
                    max={product.stock || 1}
                    value={quantity}
                    onChange={(value) => setQuantity(value || 1)}
                    style={{ width: 100 }}
                  />
                </Space>

                {/* BUTTONS */}
                <Space direction="vertical" style={{ width: "100%" }} size={8}>
                  <Button
                    type="primary"
                    block
                    onClick={addToCart}
                    disabled={product.stock <= 0}
                  >
                    Thêm vào giỏ hàng
                  </Button>

                  <Button block onClick={() => router.push("/cart")}>
                    Xem giỏ hàng
                  </Button>
                </Space>
              </Space>
            </div>
          </Col>

          {/* REVIEWS */}
          <Col span={24}>
            <Divider />
            <ProductReviews productId={productId} />
          </Col>

          {/* RELATED */}
          <Col span={24}>
            <Title level={4}>Sản phẩm liên quan</Title>

            <Row gutter={[12, 12]}>
              {related.length ? (
                related.map((item) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={item._id}>
                    <ProductCard product={item} />
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <Empty description="Không có sản phẩm liên quan" />
                </Col>
              )}
            </Row>
          </Col>
        </Row>
      )}
    </GuestLayout>
  );
};

export default ProductDetailPage;
