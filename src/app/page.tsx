"use client";

import {
  Button,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import GuestLayout from "@/components/layout/guest.layout";
import ProductCard from "@/components/guest/product.card";
import { sendRequest } from "@/utils/api";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const { Title, Text } = Typography;

const HomePage = () => {
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const search = searchParams?.get("search") ?? "";

  const loadCategories = async () => {
    setCategoryLoading(true);
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories`,
      method: "GET",
      queryParams: { current: 1, pageSize: 20 },
    });
    setCategoryLoading(false);
    if (res?.data?.results) {
      setCategories(res.data.results);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    const queryObject: any = { status: "ACTIVE" };

    if (search) {
      queryObject.name = { $regex: search, $options: "i" };
    }

    if (selectedCategory) {
      queryObject.categoryId = selectedCategory;
    }

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 12,
        query: JSON.stringify(queryObject),
      },
    });
    setLoading(false);
    if (res?.data?.results) {
      setProducts(res.data.results);
    }
  };

  const loadTopProducts = async () => {
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/top-selling`,
      method: "GET",
    });
    if (res?.data) {
      setTopProducts(res.data);
    }
  };

  useEffect(() => {
    loadCategories();
    loadTopProducts();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, selectedCategory]);

  return (
    <GuestLayout>
      <div
        style={{
          marginBottom: 24,
          background: "#ffffff",
          padding: 24,
          borderRadius: 20,
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={16}>
            <Title level={2} style={{ marginBottom: 12 }}>
              Chào mừng đến với Avenza
            </Title>
            <Text type="secondary">
              Mua sắm thiết bị giáo dục, so sánh sản phẩm, đặt hàng nhanh và
              nhận tư vấn AI ngay trong tầm tay.
            </Text>
          </Col>
          <Col xs={24} lg={8}>
            <div
              style={{ background: "#f3f4f6", borderRadius: 16, padding: 24 }}
            >
              <Title level={4}>Bắt đầu ngay</Title>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Button type="primary" block>
                  Xem sản phẩm nổi bật
                </Button>
                <Link href="/auth/login">
                  <Button block>Đăng nhập để đặt hàng</Button>
                </Link>
              </Space>
            </div>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Danh mục nổi bật</Title>
        <div
          style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}
        >
          {categoryLoading ? (
            <Skeleton active paragraph={false} />
          ) : (
            categories.map((category) => (
              <Link key={category._id} href={`/category/${category._id}`}>
                <Tag
                  color={selectedCategory === category._id ? "blue" : "default"}
                  style={{
                    cursor: "pointer",
                    padding: "8px 16px",
                    borderRadius: 999,
                  }}
                  onClick={() => setSelectedCategory(category._id)}
                >
                  {category.name}
                </Tag>
              </Link>
            ))
          )}
          {selectedCategory ? (
            <Tag
              color="default"
              style={{
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: 999,
              }}
              onClick={() => setSelectedCategory(null)}
            >
              Bỏ lọc
            </Tag>
          ) : null}
        </div>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4}>Sản phẩm</Title>
          </Col>
          <Col>
            <Text type="secondary">
              {products.length} sản phẩm
              {search ? ` phù hợp với “${search}”` : ""}
            </Text>
          </Col>
        </Row>
        <Row gutter={[24, 24]} style={{ marginTop: 12 }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={8} lg={6}>
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
              <Empty description="Không tìm thấy sản phẩm" />
            </Col>
          )}
        </Row>
      </div>

      <div style={{ background: "#ffffff", padding: 24, borderRadius: 20 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4}>Sản phẩm bán chạy</Title>
            <Text type="secondary">
              Các sản phẩm được khách hàng mua nhiều nhất trong cửa hàng.
            </Text>
          </Col>
          <Col>
            <Link href="/">
              <Button type="link">Xem thêm</Button>
            </Link>
          </Col>
        </Row>
        <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
          {topProducts.length ? (
            topProducts.slice(0, 4).map((product) => (
              <Col key={product._id} xs={24} sm={12} md={8} lg={6}>
                <ProductCard product={product} />
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Empty description="Không có sản phẩm bán chạy" />
            </Col>
          )}
        </Row>
      </div>
    </GuestLayout>
  );
};

export default HomePage;
