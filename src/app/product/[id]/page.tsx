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
import { normalizeImageUrl } from "@/utils/image";

import { useParams, useRouter } from "next/navigation";

import GuestLayout from "@/components/layout/guest.layout";

import ProductCard from "@/components/guest/product.card";

import ProductReviews from "@/components/guest/product.reviews";

import { sendRequest } from "@/utils/api";
import recommendationApi from "@/utils/recommendation.api";

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
    if (!productId) return;

    const startedAt = Date.now();

    return () => {
      const timeSpentSeconds = Math.max(
        1,
        Math.round((Date.now() - startedAt) / 1000),
      );
      recommendationApi.trackView(
        productId,
        session?.user?.access_token,
        timeSpentSeconds,
      );
    };
  }, [productId, session?.user?.access_token]);

  useEffect(() => {
    if (product) loadRelated();
  }, [product]);

  const addToCart = async () => {
    if (!session?.user?.access_token) {
      router.push("/auth/login");

      return;
    }

    try {
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
        recommendationApi.trackCart(productId, session.user.access_token);

        notification.success({
          message: "Đã thêm sản phẩm vào giỏ hàng",
        });

        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        notification.error({
          message: res?.message || "Thêm vào giỏ hàng thất bại",
        });
      }
    } catch (error) {
      notification.error({
        message: "Có lỗi xảy ra",
      });
    }
  };

  // =========================
  // FIX CATEGORY + IMAGE
  // =========================
  const imageUrlRaw =
    Array.isArray(product?.images) && product?.images.length
      ? product.images[0]
      : "/placeholder.png";

  const imageUrl = normalizeImageUrl(imageUrlRaw);

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
        <Row gutter={[24, 24]}>
          {/* LEFT IMAGE */}
          <Col xs={24} md={12}>
            <Card
              style={{
                borderRadius: 20,
                boxShadow: "0 8px 28px rgba(0,0,0,0.06)",
              }}
              styles={{
                body: {
                  padding: 12,
                },
              }}
            >
              <div
                style={{
                  background: "#fafafa",
                  padding: 20,
                  minHeight: 420,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 16,
                }}
              >
                <Image
                  src={imageUrl}
                  alt={product.name}
                  preview
                  style={{
                    width: "100%",
                    maxWidth: 420,
                    objectFit: "contain",
                  }}
                />
              </div>
            </Card>
          </Col>

          {/* RIGHT INFO */}
          <Col xs={24} md={12}>
            <Card
              style={{
                borderRadius: 20,
                boxShadow: "0 8px 28px rgba(0,0,0,0.06)",
              }}
              styles={{
                body: {
                  padding: 24,
                },
              }}
            >
              <Space
                direction="vertical"
                size={16}
                style={{
                  width: "100%",
                }}
              >
                <Title
                  level={2}
                  style={{
                    margin: 0,
                    fontSize: 28,
                  }}
                >
                  {product.name}
                </Title>

                {/* FIX CATEGORY */}
                <Text
                  type="secondary"
                  style={{
                    fontSize: 15,
                  }}
                >
                  {product.categoryId?.name || "Danh mục chung"}
                </Text>

                {/* FIX RATING */}
                <Space align="center">
                  <Rate
                    allowHalf
                    disabled
                    value={Number(product.rating) || 0}
                  />

                  <Text strong>({Number(product.rating || 0).toFixed(1)})</Text>
                </Space>

                {/* PRICE */}
                <Text
                  strong
                  style={{
                    fontSize: 32,
                    color: "#1677ff",
                  }}
                >
                  {Number(product.price).toLocaleString("vi-VN")} ₫
                </Text>

                {/* STOCK */}
                <Text
                  type={product.stock > 0 ? "success" : "danger"}
                  style={{
                    fontSize: 15,
                  }}
                >
                  {product.stock > 0
                    ? `Còn ${product.stock} sản phẩm`
                    : "Hết hàng"}
                </Text>

                {/* DESCRIPTION */}
                <Paragraph
                  style={{
                    fontSize: 14,
                    lineHeight: 1.8,
                    marginBottom: 0,
                  }}
                >
                  {product.description ||
                    "Không có mô tả chi tiết cho sản phẩm này."}
                </Paragraph>

                <Divider
                  style={{
                    margin: "4px 0",
                  }}
                />

                {/* QUANTITY */}
                <Space
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <Text strong>Số lượng:</Text>

                  <InputNumber
                    min={1}
                    max={product.stock || 1}
                    value={quantity}
                    onChange={(value) => setQuantity(value || 1)}
                    style={{
                      width: 120,
                    }}
                  />
                </Space>

                {/* BUTTONS */}
                <Space
                  direction="vertical"
                  size={12}
                  style={{
                    width: "100%",
                  }}
                >
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={addToCart}
                    disabled={product.stock <= 0}
                    style={{
                      height: 48,
                      borderRadius: 12,
                      fontWeight: 600,
                    }}
                  >
                    Thêm vào giỏ hàng
                  </Button>

                  <Button
                    size="large"
                    block
                    onClick={() => router.push("/cart")}
                    style={{
                      height: 48,
                      borderRadius: 12,
                    }}
                  >
                    Xem giỏ hàng
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>

          {/* REVIEWS */}
          <Col span={24}>
            <Divider />

            <ProductReviews productId={productId} />
          </Col>

          {/* RELATED */}
          <Col span={24}>
            <div
              style={{
                marginBottom: 20,
              }}
            >
              <Title level={4}>Sản phẩm liên quan</Title>

              <Text type="secondary">Các sản phẩm tương tự dành cho bạn</Text>
            </div>

            <Row gutter={[16, 16]}>
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
