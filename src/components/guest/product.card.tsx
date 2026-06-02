"use client";

import { Button, Card, Row, Rate, Space, Typography, message } from "antd";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { sendRequest } from "@/utils/api";
import { normalizeImageUrl } from "@/utils/image";
import { useState } from "react";

const { Text, Title } = Typography;

interface IProductCardProps {
  product: any;
  onAddToCart?: () => void;
}

const ProductCard = ({ product, onAddToCart }: IProductCardProps) => {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  const addToCart = async () => {
    if (!session?.user?.access_token) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/add`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
        body: {
          productId: product._id,
          quantity: 1,
        },
      });

      if (res?.data) {
        message.success("Đã thêm vào giỏ hàng");

        // Đổi nút thành "Xem giỏ hàng"
        setAddedToCart(true);

        // Cập nhật badge cart realtime
        window.dispatchEvent(new Event("cartUpdated"));

        onAddToCart?.();
      } else {
        message.error(res?.message || "Thêm vào giỏ hàng thất bại");
      }
    } catch (error) {
      console.error(error);
      message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (addedToCart) {
      router.push("/cart");
      return;
    }

    addToCart();
  };

  const imageUrlRaw =
    Array.isArray(product.images) && product.images.length
      ? product.images[0]
      : "/placeholder.png";

  const imageUrl = normalizeImageUrl(imageUrlRaw);

  return (
    <Card
      hoverable
      cover={
        <Link href={`/product/${product._id}`}>
          <div
            style={{
              width: "100%",
              minHeight: 180,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              background: "#fafafa",
            }}
          >
            <img
              src={imageUrl}
              alt={product.name}
              style={{
                width: "100%",
                height: "auto",
                objectFit: "cover",
              }}
            />
          </div>
        </Link>
      }
      style={{ borderRadius: 16 }}
      styles={{ body: { padding: 16 } }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Link href={`/product/${product._id}`}>
          <Title
            level={5}
            style={{
              margin: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {product.name}
          </Title>
        </Link>

        <Text type="secondary">
          {product.categoryId?.name || "Danh mục chung"}
        </Text>

        <Row align="middle" justify="space-between">
          <Rate
            allowHalf
            disabled
            value={Number(product.rating) || 0}
            style={{ fontSize: 12 }}
          />

          <Text strong style={{ color: "#1677ff" }}>
            {Number(product.price).toLocaleString("vi-VN")} ₫
          </Text>
        </Row>

        <Text type={product.stock > 0 ? "success" : "danger"}>
          {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
        </Text>

        <Button
          block
          loading={loading}
          disabled={product.stock <= 0}
          onClick={handleButtonClick}
          type={addedToCart ? "default" : "primary"}
          style={
            addedToCart
              ? {
                  background: "linear-gradient(135deg, #52c41a, #73d13d)",
                  border: "none",
                  color: "#fff",
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(82,196,26,.3)",
                  transition: "all .3s ease",
                }
              : {
                  fontWeight: 600,
                }
          }
        >
          {addedToCart ? "🛒 Xem giỏ hàng" : "Thêm vào giỏ"}
        </Button>
      </Space>
    </Card>
  );
};

export default ProductCard;
