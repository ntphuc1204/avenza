"use client";

import {
  Button,
  Card,
  Col,
  Empty,
  Pagination,
  Progress,
  Row,
  Skeleton,
  Tag,
  Typography,
  notification,
  FloatButton,
} from "antd";

import { useEffect, useState, useMemo } from "react";
import GuestLayout from "@/components/layout/guest.layout";

import ProductCard from "@/components/guest/product.card";

import { sendRequest } from "@/utils/api";
import { bannerApi } from "@/utils/banner.api";
import { normalizeImageUrl } from "@/utils/image";

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

  const [discounts, setDiscounts] = useState<any[]>([]);

  const [claimedDiscountIds, setClaimedDiscountIds] = useState<string[]>([]);
  const availableDiscounts = useMemo(() => {
    return discounts.filter(
      (discount) => !claimedDiscountIds.includes(discount._id),
    );
  }, [discounts, claimedDiscountIds]);
  const [loading, setLoading] = useState(true);

  const [categoryLoading, setCategoryLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<any[]>([]);

  const [allLoading, setAllLoading] = useState(true);

  const [allCurrent, setAllCurrent] = useState(1);

  const [banners, setBanners] = useState<any[]>([]);

  const [bannerLoading, setBannerLoading] = useState(true);

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

  const loadDiscounts = async () => {
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/discounts`,
      method: "GET",
      queryParams: {
        current: 1,
        pageSize: 6,
      },
    });

    setDiscounts(res?.data?.results ?? []);
  };

  const loadBanners = async () => {
    setBannerLoading(true);

    const res = await bannerApi.getByLocation("HOMEPAGE");

    console.log("[HomePage] loadBanners response:", res);

    setBannerLoading(false);

    // support multiple response shapes: array, { data: [] }, { data: { results: [] } }
    let bannersData: any[] = [];

    if (Array.isArray(res)) {
      bannersData = res;
    } else if (Array.isArray(res?.data)) {
      bannersData = res.data;
    } else if (Array.isArray(res?.data?.results)) {
      bannersData = res.data.results;
    } else if (Array.isArray(res?.results)) {
      bannersData = res.results;
    } else if (res?.data) {
      bannersData = Array.isArray(res.data) ? res.data : [res.data];
    }

    console.log("[HomePage] parsed banners:", bannersData);

    // attach normalized image url for easier inspection in DevTools
    const mapped = (bannersData || []).map((b: any) => ({
      ...b,
      _normalizedImage: normalizeImageUrl(b?.imageUrl),
    }));

    console.log(
      "[HomePage] NEXT_PUBLIC_BACKEND_URL:",
      process.env.NEXT_PUBLIC_BACKEND_URL,
    );
    console.log(
      "[HomePage] banners with normalized image:",
      mapped.map((b: any) => ({
        _id: b._id,
        imageUrl: b.imageUrl,
        _normalizedImage: b._normalizedImage,
      })),
    );

    setBanners(mapped);
  };

  const loadClaimedDiscounts = async () => {
    if (!session?.user?.access_token) {
      setClaimedDiscountIds([]);
      return;
    }

    const res = await sendRequest<IBackendRes<any[]>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/discounts/mine`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    const ids = (res?.data || [])
      .map((item: any) => {
        const discount = item.discountId;
        return typeof discount === "string" ? discount : discount?._id;
      })
      .filter(Boolean);

    setClaimedDiscountIds(ids);
  };

  const handleClaim = async (discountId: string) => {
    if (!session?.user?.access_token) {
      notification.warning({
        message: "Vui lòng đăng nhập để nhận voucher",
      });
      return;
    }

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/discounts/${discountId}/claim`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    if (res?.data) {
      setClaimedDiscountIds((prev) =>
        prev.includes(discountId) ? prev : [...prev, discountId],
      );

      notification.success({
        message: "Đã nhận voucher",
      });
    } else {
      notification.error({
        message: res?.message || "Nhận voucher thất bại",
      });
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

    loadDiscounts();

    loadBanners();
  }, []);

  useEffect(() => {
    loadClaimedDiscounts();
  }, [session]);

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
        {bannerLoading ? (
          <div style={{ padding: 24 }}>
            <Skeleton active paragraph={{ rows: 3 }} />
          </div>
        ) : banners.length ? (
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
            {banners.map((banner) => (
              <SwiperSlide key={banner._id}>
                {banner.link ? (
                  <a href={banner.link} target="_blank" rel="noreferrer">
                    <img
                      src={normalizeImageUrl(banner.imageUrl)}
                      alt={banner.title || "banner"}
                      style={{
                        width: "100%",
                        aspectRatio: "16 / 6",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  </a>
                ) : (
                  <img
                    src={normalizeImageUrl(banner.imageUrl)}
                    alt={banner.title || "banner"}
                    style={{
                      width: "100%",
                      aspectRatio: "16 / 6",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 6",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              background: "#f5f5f5",
            }}
          >
            <Text type="secondary">Chưa có banner nào</Text>
          </div>
        )}
      </div>

      {/* DISCOUNTS */}
      {availableDiscounts.length ? (
        <div
          style={{
            ...cardStyle,
            marginBottom: 24,
          }}
        >
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={4}>Voucher nổi bật</Title>

              <Text type="secondary">
                Nhận mã ưu đãi và áp dụng khi checkout.
              </Text>
            </Col>
          </Row>

          <div
            style={{
              display: "flex",
              gap: 16,
              marginTop: 16,
              overflowX: "auto",
              overflowY: "hidden",
              paddingBottom: 8,
            }}
          >
            {availableDiscounts.map((discount) => {
              const isClaimed = claimedDiscountIds.includes(discount._id);

              const remaining =
                discount.quantity > 0
                  ? Math.max(discount.quantity - discount.used, 0)
                  : null;

              const percent =
                discount.quantity > 0
                  ? Math.round((discount.used / discount.quantity) * 100)
                  : 0;

              return (
                <div
                  key={discount._id}
                  style={{
                    flex: "0 0 clamp(280px, 32%, 380px)",
                  }}
                >
                  <Card
                    bordered={false}
                    style={{
                      height: "100%",
                      minHeight: 220,
                      borderRadius: 16,
                      color: "#fff",
                      background: "linear-gradient(135deg,#ff7a18,#ffb347)",
                      boxShadow: "0 12px 28px rgba(255,122,24,0.22)",
                    }}
                  >
                    <Tag color="red">HOT</Tag>

                    <Title
                      level={5}
                      style={{
                        color: "#fff",
                        marginTop: 12,
                      }}
                    >
                      {discount.title}
                    </Title>

                    <Text style={{ color: "#fff" }}>Mã {discount.code}</Text>

                    <br />

                    <Text style={{ color: "#fff" }}>
                      Đơn từ{" "}
                      {Number(discount.minOrderValue || 0).toLocaleString(
                        "vi-VN",
                      )}{" "}
                      đ
                    </Text>

                    <br />

                    <Text style={{ color: "#fff" }}>
                      {discount.type === "PERCENT"
                        ? `Giảm ${discount.value}%`
                        : `Giảm ${Number(discount.value).toLocaleString(
                            "vi-VN",
                          )} đ`}
                    </Text>

                    <br />

                    <Text
                      style={{
                        color: "rgba(255,255,255,0.86)",
                      }}
                    >
                      HSD:{" "}
                      {discount.expiredAt
                        ? new Date(discount.expiredAt).toLocaleDateString(
                            "vi-VN",
                          )
                        : "Không giới hạn"}
                    </Text>

                    <div style={{ marginTop: 14 }}>
                      <Progress
                        percent={percent}
                        showInfo={false}
                        strokeColor="#fff"
                        trailColor="rgba(255,255,255,0.35)"
                      />

                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 13,
                        }}
                      >
                        {remaining === null
                          ? "Không giới hạn lượt dùng"
                          : `Còn ${remaining} lượt`}
                      </Text>
                    </div>

                    {isClaimed ? (
                      <Tag
                        color="green"
                        style={{
                          marginTop: 14,
                        }}
                      >
                        Đã nhận
                      </Tag>
                    ) : (
                      <Button
                        type="primary"
                        ghost
                        style={{
                          marginTop: 14,
                        }}
                        onClick={() => handleClaim(discount._id)}
                      >
                        Nhận voucher
                      </Button>
                    )}
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

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
                key={category.id}
                color={selectedCategory === category.id ? "blue" : "default"}
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

      {/* TOP SELLING */}
      <div style={{ ...cardStyle, marginTop: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4}>Sản phẩm bán chạy</Title>

            <Text type="secondary">
              Các sản phẩm được khách hàng mua nhiều nhất.
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

      {/* BACK TO TOP */}
      <FloatButton.BackTop
        visibilityHeight={300}
        style={{
          right: 24,
          bottom: 24,
        }}
      />
    </GuestLayout>
  );
};

export default HomePage;
