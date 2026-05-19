"use client";

import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  notification,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
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
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [history]);

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

            <div
              ref={chatContainerRef}
              style={{
                minHeight: 420,
                maxHeight: 520,
                overflowY: "auto",
                padding: 24,
                background: "#f0f2f5",
              }}
            >
              {history.length ? (
                history.map((item, index) => {
                  const isUser = item.sender === "user";
                  return (
                    <div
                      key={`${item.sender}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-end",
                          gap: 10,
                          maxWidth: "85%",
                          flexDirection: isUser ? "row-reverse" : "row",
                        }}
                      >
                        <Avatar
                          style={{
                            backgroundColor: isUser ? "#1890ff" : "#ffffff",
                            color: isUser ? "#ffffff" : "#000000",
                            border: isUser ? "none" : "1px solid #d9d9d9",
                          }}
                        >
                          {isUser ? "U" : "AI"}
                        </Avatar>
                        <div
                          style={{
                            background: isUser ? "#0084ff" : "#ffffff",
                            color: isUser ? "#ffffff" : "#000000",
                            padding: "14px 18px",
                            borderRadius: 20,
                            borderTopRightRadius: isUser ? 0 : 20,
                            borderTopLeftRadius: isUser ? 20 : 0,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          <Text
                            style={{ color: isUser ? "#ffffff" : "#000000" }}
                          >
                            {item.message}
                          </Text>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", color: "#8c8c8c" }}>
                  Chưa có tin nhắn nào. Hãy bắt đầu trò chuyện với AI.
                </div>
              )}
            </div>

            <div style={{ padding: 20, background: "#ffffff" }}>
              <Input.TextArea
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Nhập câu hỏi hoặc yêu cầu của bạn..."
              />
              <Row
                justify="space-between"
                align="middle"
                style={{ marginTop: 16 }}
              >
                <Col>
                  <Button onClick={recommendProduct} loading={recommendLoading}>
                    Gợi ý sản phẩm
                  </Button>
                </Col>
                <Col>
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={sendMessage}
                    loading={loading}
                  >
                    Gửi
                  </Button>
                </Col>
              </Row>
            </div>
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
