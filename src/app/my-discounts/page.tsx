"use client";

import { Button, Card, Empty, List, Space, Tag, Typography } from "antd";
import { GiftOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";
import { sendRequest } from "@/utils/api";

const { Title, Text } = Typography;

const MyDiscountsPage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDiscounts = async () => {
    if (!session?.user?.access_token) return;

    setLoading(true);

    const res = await sendRequest<IBackendRes<any[]>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/discounts/mine`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });

    setLoading(false);

    const availableDiscounts = (res?.data ?? []).filter(
      (item: any) => !item.isUsed && item.discountId,
    );

    setDiscounts(availableDiscounts);
  };

  useEffect(() => {
    loadDiscounts();
  }, [session]);

  if (!session) {
    return (
      <GuestLayout>
        <Card
          style={{
            textAlign: "center",
            borderRadius: 20,
          }}
        >
          <Title level={3}>Đăng nhập để xem voucher của bạn</Title>

          <Button type="primary" onClick={() => router.push("/auth/login")}>
            Đăng nhập ngay
          </Button>
        </Card>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <Space direction="vertical" size={18} style={{ width: "100%" }}>
        <div>
          <Title level={3}>Voucher của tôi</Title>

          <Text type="secondary">
            Những voucher bạn đã nhận và có thể áp dụng khi thanh toán.
          </Text>
        </div>

        <List
          loading={loading}
          dataSource={discounts}
          locale={{
            emptyText: (
              <Empty description="Bạn không còn voucher khả dụng nào" />
            ),
          }}
          renderItem={(item) => {
            const discount = item.discountId;

            return (
              <List.Item>
                <Card
                  style={{
                    width: "100%",
                    borderRadius: 16,
                    borderLeft: "6px solid #ff7a18",
                  }}
                >
                  <Space
                    align="start"
                    style={{
                      width: "100%",
                      justifyContent: "space-between",
                    }}
                  >
                    <Space align="start">
                      <GiftOutlined
                        style={{
                          fontSize: 28,
                          color: "#ff7a18",
                        }}
                      />

                      <div>
                        <Title level={5} style={{ margin: 0 }}>
                          {discount.title}
                        </Title>

                        <Text>
                          Mã: <b>{discount.code}</b>
                        </Text>

                        <br />

                        <Text type="secondary">
                          Đơn từ{" "}
                          {Number(discount.minOrderValue || 0).toLocaleString(
                            "vi-VN",
                          )}{" "}
                          đ
                        </Text>

                        <br />

                        <Text type="secondary">
                          HSD:{" "}
                          {discount.expiredAt
                            ? new Date(discount.expiredAt).toLocaleDateString(
                                "vi-VN",
                              )
                            : "Không giới hạn"}
                        </Text>

                        <br />

                        <Text type="secondary">
                          {discount.type === "PERCENT"
                            ? `Giảm ${discount.value}%`
                            : `Giảm ${Number(discount.value).toLocaleString(
                                "vi-VN",
                              )} đ`}
                        </Text>
                      </div>
                    </Space>

                    <Tag color="orange">Có thể sử dụng</Tag>
                  </Space>
                </Card>
              </List.Item>
            );
          }}
        />
      </Space>
    </GuestLayout>
  );
};

export default MyDiscountsPage;
