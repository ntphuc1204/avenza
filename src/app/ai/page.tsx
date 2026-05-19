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
  Spin,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GuestLayout from "@/components/layout/guest.layout";

const { Title, Text } = Typography;

const AIPage = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  const chatRef = useRef<HTMLDivElement>(null);

  // ================= LOAD HISTORY =================
  const loadHistory = async () => {
    if (!session?.user?.access_token) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/history`,
      {
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
      },
    );

    const data = await res.json();
    setHistory(data?.data || []);
  };

  useEffect(() => {
    loadHistory();
  }, [session]);

  // auto scroll
  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history]);

  // ================= STREAM CHAT =================
  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMsg = message;

    setMessage("");

    setHistory((prev) => [
      ...prev,
      {
        sender: "user",
        message: userMsg,
      },
      {
        sender: "ai",
        message: "",
      },
    ]);

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/chat-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.user?.access_token}`,
          },
          body: JSON.stringify({
            message: userMsg,
          }),
        },
      );

      if (!res.body) {
        throw new Error("No stream");
      }

      const reader = res.body.getReader();

      const decoder = new TextDecoder("utf-8");

      let aiText = "";
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, {
          stream: true,
        });

        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();

          if (!trimmed.startsWith("data:")) continue;

          const text = trimmed.replace("data:", "").trim();

          if (text === "[DONE]") {
            setLoading(false);
            return;
          }

          try {
            const parsed = JSON.parse(text);

            if (parsed.error) {
              notification.error({
                message: parsed.message || "AI Error",
              });

              continue;
            }

            if (parsed.content) {
              aiText += parsed.content;

              setHistory((prev) => {
                const copy = [...prev];

                const last = copy.length - 1;

                if (copy[last]?.sender === "ai") {
                  copy[last] = {
                    ...copy[last],
                    message: aiText,
                  };
                }

                return copy;
              });
            }
          } catch (err) {
            console.log("Parse SSE error", err);
          }
        }
      }

      setLoading(false);
    } catch (err) {
      console.log(err);

      setLoading(false);

      notification.error({
        message: "Stream lỗi AI",
      });
    }
  };
  // ================= RECOMMEND =================
  const recommend = async () => {
    if (!message.trim()) return;

    setRecLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/recommend`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.user?.access_token}`,
        },
        body: JSON.stringify({ context: message }),
      },
    );

    const data = await res.json();

    setRecLoading(false);

    if (data?.data?.recommendations) {
      setRecommendations(data.data.recommendations);
    }
  };

  // ================= UI =================
  if (!session) {
    return (
      <GuestLayout>
        <Card style={{ textAlign: "center" }}>
          <Title level={3}>Đăng nhập để dùng AI</Title>
          <Button onClick={() => router.push("/auth/login")}>Đăng nhập</Button>
        </Card>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <Row gutter={20}>
        {/* CHAT */}
        <Col xs={24} lg={14}>
          <Card title="💬 AI Chat (Streaming)">
            <div
              ref={chatRef}
              style={{
                height: 520,
                overflowY: "auto",
                background: "#f5f5f5",
                padding: 16,
                borderRadius: 10,
              }}
            >
              {history.map((item, i) => {
                const isUser = item.sender === "user";

                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      marginBottom: 10,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: 12,
                        borderRadius: 12,
                        background: isUser ? "#1677ff" : "#fff",
                        color: isUser ? "#fff" : "#000",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {item.message}
                    </div>
                  </div>
                );
              })}

              {loading && <Spin />}
            </div>

            <Divider />

            <Space.Compact style={{ width: "100%" }}>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onPressEnter={sendMessage}
                placeholder="Nhập câu hỏi..."
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={sendMessage}
              >
                Gửi
              </Button>
            </Space.Compact>

            <Button
              style={{ marginTop: 10 }}
              loading={recLoading}
              onClick={recommend}
            >
              Gợi ý sản phẩm
            </Button>
          </Card>
        </Col>

        {/* RECOMMEND */}
        <Col xs={24} lg={10}>
          <Card title="🛍 Gợi ý sản phẩm">
            {recommendations.length === 0 ? (
              <Empty description="Chưa có gợi ý" />
            ) : (
              recommendations.map((p, i) => (
                <Card key={i} size="small" style={{ marginBottom: 10 }}>
                  <Text strong>{p.name}</Text>
                  <br />
                  <Text>{Number(p.price).toLocaleString()} ₫</Text>
                  <br />
                  <Tag color="blue">{p.categoryId?.name}</Tag>
                </Card>
              ))
            )}
          </Card>
        </Col>
      </Row>
    </GuestLayout>
  );
};

export default AIPage;
