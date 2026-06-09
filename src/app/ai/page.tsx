"use client";

import { Button, Card, Spin, Typography } from "antd";

const { Title, Text } = Typography;
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";
import AiChatPanel from "@/components/ai/ai-chat-panel";

const AIPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <GuestLayout>
        <div style={{ textAlign: "center", padding: 80 }}>
          <Spin size="large" tip="Đang tải..." />
        </div>
      </GuestLayout>
    );
  }

  if (!session?.user?.access_token) {
    return (
      <GuestLayout>
        <Card style={{ textAlign: "center", maxWidth: 480, margin: "40px auto" }}>
          <Title level={3}>Đăng nhập để dùng AI</Title>
          <Text type="secondary">
            Trợ lý AI hỗ trợ tìm sản phẩm, theo dõi đơn hàng, voucher và giỏ hàng.
          </Text>
          <div style={{ marginTop: 20 }}>
            <Button type="primary" onClick={() => router.push("/auth/login")}>
              Đăng nhập
            </Button>
          </div>
        </Card>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 0 24px" }}>
        <AiChatPanel
          key={session.user.access_token}
          accessToken={session.user.access_token}
        />
      </div>
    </GuestLayout>
  );
};

export default AIPage;
