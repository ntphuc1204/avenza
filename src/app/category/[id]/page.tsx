"use client";

import { Button, Card, Col, Empty, Row, Skeleton, Typography } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";
import ProductCard from "@/components/guest/product.card";
import { sendRequest } from "@/utils/api";
import Link from "next/link";

const { Title, Text } = Typography;

const CategoryPage = () => {
  const params = useParams();
  const categoryId = params?.id as string;

  const [category, setCategory] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCategory = async () => {
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories/${categoryId}`,
      method: "GET",
    });
    if (res?.data) {
      setCategory(res.data);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 20,
        query: JSON.stringify({ categoryId, status: "ACTIVE" }),
      },
    });
    setLoading(false);
    if (res?.data?.results) {
      setProducts(res.data.results);
    }
  };

  useEffect(() => {
    if (categoryId) {
      loadCategory();
      loadProducts();
    }
  }, [categoryId]);

  return (
    <GuestLayout>
      <div style={{ marginBottom: 20 }}>
        <Link href="/">
          <Button type="link">← Quay lại trang chủ</Button>
        </Link>
      </div>
      <div
        style={{
          background: "#ffffff",
          padding: 24,
          borderRadius: 20,
          marginBottom: 24,
          boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
        }}
      >
        <Title level={3}>{category?.name || "Danh mục"}</Title>
        <Text type="secondary">
          {category?.description || "Các sản phẩm thuộc danh mục này."}
        </Text>
      </div>

      <div>
        <Row gutter={[24, 24]}>
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={8}>
                <Skeleton active />
              </Col>
            ))
          ) : products.length ? (
            products.map((product) => (
              <Col key={product._id} xs={24} sm={12} md={8} lg={6}>
                <ProductCard product={product} />
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Empty description="Chưa có sản phẩm trong danh mục này" />
            </Col>
          )}
        </Row>
      </div>
    </GuestLayout>
  );
};

export default CategoryPage;
