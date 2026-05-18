"use client";

import { Button, Card, Col, Rate, Row, Space, Typography, message } from "antd";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { sendRequest } from "@/utils/api";
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

  const addToCart = async () => {
    if (!session?.user?.access_token) {
      router.push("/auth/login");
      return;
    }

    setLoading(true);
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
    setLoading(false);

    if (res?.data) {
      message.success("Đã thêm vào giỏ hàng");
      onAddToCart?.();
    } else {
      message.error(res?.message || "Thêm vào giỏ hàng thất bại");
    }
  };

  const imageUrl =
    Array.isArray(product.images) && product.images.length
      ? product.images[0]
      : "/placeholder.png";

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
              style={{ width: "100%", height: 180, objectFit: "cover" }}
            />
          </div>
        </Link>
      }
      style={{ borderRadius: 16 }}
      bodyStyle={{ padding: 16 }}
    >
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Link href={`/product/${product._id}`}>
          <Title level={5} style={{ margin: 0 }}>
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
            defaultValue={product.rating || 0}
            style={{ fontSize: 12 }}
          />
          <Text strong style={{ color: "#1677ff" }}>
            {Number(product.price).toLocaleString("vi-VN")} ₫
          </Text>
        </Row>
        <Text type={product.stock ? "success" : "danger"}>
          {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : "Hết hàng"}
        </Text>
        <Button
          type="primary"
          block
          onClick={addToCart}
          loading={loading}
          disabled={product.stock <= 0}
        >
          Thêm vào giỏ
        </Button>
      </Space>
    </Card>
  );
};

export default ProductCard;
