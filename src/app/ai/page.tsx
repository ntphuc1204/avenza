"use client";

import {
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  List,
  Row,
  Space,
  Tag,
  Typography,
  notification,
} from "antd";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";
import { sendRequest } from "@/utils/api";

const { Title, Text } = Typography;

const AIPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [answer, setAnswer] = useState<string>("");
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);

  const loadHistory = async () => {
    if (!session?.user?.access_token) return;
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/history`,
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
    });
    if (res?.data) {
      setHistory(res.data);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [session]);

  const sendMessage = async () => {
    if (!message.trim()) {
      notification.warning({ message: "Nhập câu hỏi để gửi cho AI" });
      return;
    }
    if (!session?.user?.access_token) {
      router.push("/auth/login");
      return;
    }
    setLoading(true);
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/chat`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
      body: { message },
    });
    setLoading(false);
    if (res?.data?.message) {
      setAnswer(res.data.message);
      setHistory((prev) => [
        ...prev,
        { sender: "user", message },
        { sender: "ai", message: res.data.message },
      ]);
      setMessage("");
    } else {
      notification.error({ message: res?.message || "AI trả lời thất bại" });
    }
  };

  const recommendProduct = async () => {
    if (!message.trim()) {
      notification.warning({ message: "Nhập nội dung để AI gợi ý sản phẩm" });
      return;
    }
    if (!session?.user?.access_token) {
      router.push("/auth/login");
      return;
    }
    setRecommendLoading(true);
    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/recommend`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.user.access_token}`,
      },
      body: { context: message },
    });
    setRecommendLoading(false);
    if (res?.data?.recommendations) {
      setRecommendations(res.data.recommendations);
      notification.success({ message: "AI đã gợi ý sản phẩm" });
    } else {
      notification.error({ message: res?.message || "Gợi ý thất bại" });
    }
  };

  if (!session) {
    return (
      <GuestLayout>
        <div
          style={{
            textAlign: "center",
            padding: 40,
            background: "#ffffff",
            borderRadius: 20,
          }}
        >
          <Title level={3}>Đăng nhập để dùng tính năng AI</Title>
          <Button type="primary" onClick={() => router.push("/auth/login")}>
            Đăng nhập ngay
          </Button>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>Trợ lý AI Avenza</Title>
        <Text type="secondary">
          Hỏi đáp sản phẩm, đề xuất mua sắm và tư vấn nhanh theo nhu cầu của
          bạn.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={14}>
          <Card style={{ borderRadius: 20 }}>
            <Title level={5}>Chat với AI</Title>
            <Input.TextArea
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Hỏi AI về sản phẩm, hướng dẫn, gợi ý..."
            />
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={sendMessage} loading={loading}>
                Gửi câu hỏi
              </Button>
              <Button onClick={recommendProduct} loading={recommendLoading}>
                Gợi ý sản phẩm
              </Button>
            </Space>

            {answer ? (
              <div style={{ marginTop: 24 }}>
                <Title level={5}>AI trả lời</Title>
                <Text>{answer}</Text>
              </div>
            ) : null}
          </Card>

          <Card style={{ borderRadius: 20, marginTop: 24 }}>
            <Title level={5}>Lịch sử hội thoại</Title>
            <List
              dataSource={history}
              locale={{ emptyText: "Chưa có lịch sử hội thoại" }}
              renderItem={(item) => (
                <List.Item>
                  <Text strong>{item.sender === "ai" ? "AI:" : "Bạn:"}</Text>{" "}
                  {item.message}
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card style={{ borderRadius: 20 }}>
            <Title level={5}>Gợi ý sản phẩm</Title>
            <Text type="secondary">
              AI sẽ chọn ra các sản phẩm phù hợp theo nhu cầu hoặc lịch sử mua
              hàng của bạn.
            </Text>
            <Divider />
            {recommendations.length ? (
              <List
                dataSource={recommendations}
                renderItem={(item) => (
                  <List.Item>
                    <div style={{ width: "100%" }}>
                      <Text strong>{item.name}</Text>
                      <div>
                        <Text type="secondary">
                          {Number(item.price).toLocaleString("vi-VN")} ₫
                        </Text>
                        <div>
                          <Tag color="blue">{item.categoryId?.name}</Tag>
                        </div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Chưa có gợi ý" />
            )}
          </Card>
        </Col>
      </Row>
    </GuestLayout>
  );
};

export default AIPage;
