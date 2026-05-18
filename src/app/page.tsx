"use client";

import {
  Button,
  Col,
  Empty,
  Pagination,
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
import { useSession } from "next-auth/react";

const { Title, Text } = Typography;

const HomePage = () => {
  const { data: session } = useSession();

  const searchParams = useSearchParams();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [allLoading, setAllLoading] = useState(true);

  const [allCurrent, setAllCurrent] = useState(1);

  const [allPageSize] = useState(12);

  const [allTotal, setAllTotal] = useState(0);

  const search = searchParams?.get("search") ?? "";

  const buildProductQueryParams = (page = 1) => {
    const params: any = {
      current: page,
      pageSize: allPageSize,
    };

    if (search) {
      params.search = search;
    }

    return params;
  };

  const loadCategories = async () => {
    setCategoryLoading(true);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 20,
      },
    });

    setCategoryLoading(false);

    if (res?.data?.results) {
      setCategories(res.data.results);
    }
  };

  const loadProducts = async () => {
    setLoading(true);

    let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`;

    if (selectedCategory) {
      url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/category/${selectedCategory}`;
    }

    const res = await sendRequest<IBackendRes<any>>({
      url,
      method: "GET",
      queryParams: buildProductQueryParams(1),
    });

    setLoading(false);

    if (res?.data?.results) {
      setProducts(res.data.results);
    } else if (Array.isArray(res?.data)) {
      setProducts(res.data);
    } else {
      setProducts([]);
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

  const loadAllProducts = async (page = 1) => {
    setAllLoading(true);

    let url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`;

    if (selectedCategory) {
      url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products/category/${selectedCategory}`;
    }

    const res = await sendRequest<IBackendRes<any>>({
      url,
      method: "GET",
      queryParams: buildProductQueryParams(page),
    });

    setAllLoading(false);

    if (res?.data?.results) {
      setAllProducts(res.data.results);

      setAllTotal(res.data.meta?.total || 0);

      setAllCurrent(page);
    } else if (Array.isArray(res?.data)) {
      setAllProducts(res.data);

      setAllTotal(res.data.length);

      setAllCurrent(page);
    } else {
      setAllProducts([]);

      setAllTotal(0);
    }
  };

  useEffect(() => {
    loadCategories();

    loadTopProducts();
  }, []);

  useEffect(() => {
    loadProducts();

    loadAllProducts(1);
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
              style={{
                background: "#f3f4f6",
                borderRadius: 16,
                padding: 24,
              }}
            >
              <Title level={4}>Bắt đầu ngay</Title>

              <Space direction="vertical" style={{ width: "100%" }}>
                <Button
                  type="primary"
                  block
                  onClick={() =>
                    document.getElementById("product-section")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                >
                  Xem sản phẩm nổi bật
                </Button>

                {!session?.user && (
                  <Link href="/auth/login">
                    <Button block>Đăng nhập để đặt hàng</Button>
                  </Link>
                )}
              </Space>
            </div>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: 24 }}>
        <Title level={4}>Danh mục nổi bật</Title>

        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 12,
          }}
        >
          {categoryLoading ? (
            <Skeleton active paragraph={false} />
          ) : (
            categories.map((category) => (
              <Tag
                key={category._id}
                color={selectedCategory === category._id ? "blue" : "default"}
                style={{
                  cursor: "pointer",
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 14,
                }}
                onClick={() => setSelectedCategory(category._id)}
              >
                {category.name}
              </Tag>
            ))
          )}

          {selectedCategory ? (
            <Tag
              color="red"
              style={{
                cursor: "pointer",
                padding: "8px 16px",
                borderRadius: 999,
                fontSize: 14,
              }}
              onClick={() => setSelectedCategory(null)}
            >
              Bỏ lọc
            </Tag>
          ) : null}
        </div>
      </div>

      <div style={{ marginBottom: 24 }} id="product-section">
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

      <div
        style={{
          background: "#ffffff",
          padding: 24,
          borderRadius: 20,
        }}
      >
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

      <div
        style={{
          marginTop: 24,
          background: "#ffffff",
          padding: 24,
          borderRadius: 20,
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4}>Tất cả sản phẩm</Title>

            <Text type="secondary">
              Xem tất cả sản phẩm hiện có trong cửa hàng.
            </Text>
          </Col>

          <Col>
            <Text type="secondary">{allTotal} sản phẩm</Text>
          </Col>
        </Row>

        <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
          {allLoading ? (
            Array.from({ length: 8 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={8} lg={6}>
                <Skeleton active />
              </Col>
            ))
          ) : allProducts.length ? (
            allProducts.map((product) => (
              <Col key={product._id} xs={24} sm={12} md={8} lg={6}>
                <ProductCard product={product} />
              </Col>
            ))
          ) : (
            <Col span={24}>
              <Empty description="Không có sản phẩm nào." />
            </Col>
          )}
        </Row>

        {allTotal > allPageSize && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: 24,
            }}
          >
            <Pagination
              current={allCurrent}
              pageSize={allPageSize}
              total={allTotal}
              onChange={(page) => loadAllProducts(page)}
              showSizeChanger={false}
            />
          </div>
        )}
      </div>
    </GuestLayout>
  );
};

export default HomePage;
