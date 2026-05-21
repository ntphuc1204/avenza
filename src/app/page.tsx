"use client";

import {
  Button,
  Col,
  Empty,
  Pagination,
  Row,
  Skeleton,
  Tag,
  Typography,
} from "antd";

import { useEffect, useState } from "react";

import GuestLayout from "@/components/layout/guest.layout";

import ProductCard from "@/components/guest/product.card";

import { sendRequest } from "@/utils/api";

import { useSearchParams } from "next/navigation";

import { useSession } from "next-auth/react";

// SWIPER
import { Swiper, SwiperSlide } from "swiper/react";

import { Autoplay, Pagination as SwiperPagination } from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

const { Title, Text } = Typography;

const cardStyle = {
  background: "#ffffff",
  padding: 24,
  borderRadius: 20,
  boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
  border: "1px solid rgba(0,0,0,0.04)",
};

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
    const filter: any = {};

    if (selectedCategory) {
      filter.categoryId = selectedCategory;
    }

    if (search) {
      filter.search = search;
    }

    return {
      current: page,
      pageSize: allPageSize,
      query: JSON.stringify(filter),
    };
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

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`,
      method: "GET",
      queryParams: buildProductQueryParams(1),
    });

    setLoading(false);

    if (res?.data?.results) {
      setProducts(res.data.results);
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

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/products`,
      method: "GET",
      queryParams: buildProductQueryParams(page),
    });

    setAllLoading(false);

    if (res?.data?.results) {
      setAllProducts(res.data.results);

      setAllTotal(res.data.meta?.total || 0);

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

  useEffect(() => {
    setAllCurrent(1);
  }, [selectedCategory, search]);

  return (
    <GuestLayout>
      {/* BANNER */}
      <div
        style={{
          marginBottom: 24,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
        }}
      >
        <Swiper
          modules={[Autoplay, SwiperPagination]}
          autoplay={{
            delay: 3000,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          loop
        >
          <SwiperSlide>
            <img
              src="/banner1.jpg"
              alt="banner1"
              style={{
                width: "100%",
                aspectRatio: "16 / 6",
                objectFit: "cover",
                display: "block",
              }}
            />
          </SwiperSlide>

          <SwiperSlide>
            <img
              src="/banner2.jpg"
              alt="banner2"
              style={{
                width: "100%",
                aspectRatio: "16 / 6",
                objectFit: "cover",
                display: "block",
              }}
            />
          </SwiperSlide>

          <SwiperSlide>
            <img
              src="/banner3.jpg"
              alt="banner3"
              style={{
                width: "100%",
                aspectRatio: "16 / 6",
                objectFit: "cover",
                display: "block",
              }}
            />
          </SwiperSlide>
        </Swiper>
      </div>

      {/* CATEGORY */}
      <div
        style={{
          ...cardStyle,
          marginBottom: 24,
        }}
      >
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

      {/* PRODUCTS */}
      <div
        style={{
          ...cardStyle,
          marginBottom: 24,
        }}
        id="product-section"
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4}>Sản phẩm</Title>
          </Col>

          <Col>
            <Text type="secondary">
              {products.length} sản phẩm
              {search ? ` phù hợp với "${search}"` : ""}
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

      {/* TOP SELLING */}
      <div style={cardStyle}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4}>Sản phẩm bán chạy</Title>

            <Text type="secondary">
              Các sản phẩm được khách hàng mua nhiều nhất trong cửa hàng.
            </Text>
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

      {/* ALL PRODUCTS */}
      <div
        style={{
          ...cardStyle,
          marginTop: 24,
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
