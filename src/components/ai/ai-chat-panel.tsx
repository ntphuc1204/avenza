"use client";

import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Row,
  Space,
  Spin,
  Tag,
  Typography,
  message,
  Tabs,
} from "antd";
import {
  RobotOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AiChatMeta,
  fetchAiHistory,
  fetchAiRecommend,
  sendAiChat,
  streamAiChat,
} from "@/utils/ai.api";

const { Text, Title } = Typography;

const INTENT_LABELS: Record<string, string> = {
  product_search: "Tìm sản phẩm",
  product_compare: "So sánh SP",
  product_recommend: "Gợi ý SP",
  order_track: "Theo dõi đơn",
  order_history: "Lịch sử đơn",
  voucher_lookup: "Voucher",
  cart_add: "Thêm giỏ hàng",
  cart_view: "Xem giỏ",
  faq: "Hỗ trợ / FAQ",
  unknown: "Tư vấn chung",
};

const QUICK_PROMPTS = [
  "Đơn hàng của tôi tới đâu rồi?",
  "Voucher của tôi có gì?",
  "Ghế học sinh dưới 2 triệu",
  "Xem giỏ hàng của tôi",
  "Gợi ý sản phẩm cho trẻ em",
];

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  message: string;
  createdAt?: string;
  meta?: AiChatMeta;
  streaming?: boolean;
}

interface AiChatPanelProps {
  accessToken: string;
  showSidebar?: boolean;
  title?: string;
}

const formatPrice = (price: number) =>
  `${Number(price || 0).toLocaleString("vi-VN")} ₫`;

const ProductList = ({ products }: { products?: any[] }) => {
  if (!products?.length) return null;

  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {products.slice(0, 4).map((p) => (
        <div
          key={p._id}
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: "#f5f5f5",
            border: "1px solid #eee",
          }}
        >
          <Text strong>{p.name}</Text>
          <div>
            <Text type="secondary">{formatPrice(p.price)}</Text>
            {p.category && (
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {p.category}
              </Tag>
            )}
          </div>
          {p._id && (
            <Link href={`/product/${p._id}`} style={{ fontSize: 12 }}>
              Xem chi tiết →
            </Link>
          )}
        </div>
      ))}
    </div>
  );
};

const AiChatPanel = ({
  accessToken,
  showSidebar = true,
  title = "AI Shopping Assistant",
}: AiChatPanelProps) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const [lastIntent, setLastIntent] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const mapHistoryItems = (items: any[]): ChatMessage[] =>
    items
      .filter((item) => item?.message?.trim())
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((item: any, index: number) => ({
        id: String(item._id || `hist-${index}`),
        sender: item.sender === "ai" ? "ai" : "user",
        message: String(item.message || ""),
        createdAt: item.createdAt,
      }));

  const loadHistory = useCallback(
    async (silent = false) => {
      if (!accessToken) return;
      if (!silent) setHistoryLoading(true);
      try {
        const items = await fetchAiHistory(accessToken);
        // map and remove consecutive duplicate entries (same sender + same message)
        const mapped = mapHistoryItems(items);
        const deduped: ChatMessage[] = [];
        for (const it of mapped) {
          if (
            deduped.length === 0 ||
            deduped[deduped.length - 1].sender !== it.sender ||
            deduped[deduped.length - 1].message !== it.message
          ) {
            deduped.push(it);
          }
        }

        setMessages(deduped);
      } catch (err: any) {
        if (!silent) {
          message.error(err?.message || "Không tải được lịch sử");
        }
      } finally {
        if (!silent) setHistoryLoading(false);
      }
    },
    [accessToken],
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const updateAiMessage = (aiId: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === aiId ? { ...m, ...patch } : m)),
    );
  };

  const sendMessage = async (text?: string) => {
    const userMsg = (text ?? input).trim();
    if (!userMsg || loading) return;

    setInput("");
    setLoading(true);

    const userId = `user-${Date.now()}`;
    const aiId = `ai-${Date.now()}`;

    console.debug("[AiChat] append user", { userId, userMsg });
    setMessages((prev) => [
      ...prev,
      { id: userId, sender: "user", message: userMsg },
      { id: aiId, sender: "ai", message: "", streaming: true },
    ]);
    // sanitize AI text to remove accidental repeats/echoes of the user question
    const sanitizeAiText = (txt: string, userQ: string) => {
      if (!txt) return txt;
      let t = String(txt || "");
      const u = String(userQ || "").trim();

      if (!u) return t.trim();

      const normalize = (s: string) =>
        String(s || "")
          .toLowerCase()
          .replace(/[^^\p{L}\p{N}\s]/gu, "")
          .replace(/\s+/g, " ")
          .trim();

      try {
        const nT = normalize(t);
        const nU = normalize(u);

        if (nU && nT.endsWith(nU)) {
          const idx = t.toLowerCase().lastIndexOf(u.toLowerCase());
          if (idx >= 0) t = t.slice(0, idx);
        }

        if (nU && nT.startsWith(nU)) {
          const idx = t.toLowerCase().indexOf(u.toLowerCase());
          if (idx === 0) t = t.slice(u.length);
        }
      } catch (err) {
        if (t.trim().endsWith(u)) {
          const idx = t.lastIndexOf(u);
          if (idx >= 0) t = t.slice(0, idx);
        }
      }

      const out = t.trim();
      if (!out) return String(txt || "").trim();
      return out;
    };

    try {
      await streamAiChat(accessToken, userMsg, {
        onMeta: (meta) => {
          setLastIntent(meta.intent || "");
          if (meta.products?.length) {
            setRecommendations(meta.products);
          }
          updateAiMessage(aiId, { meta });
          if (meta.action?.success) {
            message.success(meta.action.message);
          } else if (meta.action && !meta.action.success) {
            message.warning(meta.action.message);
          }
        },
        onChunk: (_, fullText) => {
          console.debug("[AiChat] chunk raw", { aiId, fullText });
          const sanitized = sanitizeAiText(fullText, userMsg);
          console.debug("[AiChat] chunk sanitized", { aiId, sanitized });
          updateAiMessage(aiId, { message: sanitized });
        },
        onError: (err) => {
          message.error(err);
        },
        onDone: async (result) => {
          const raw =
            result.text ||
            result.error ||
            "AI không trả lời. Vui lòng thử lại.";

          const sanitized = sanitizeAiText(raw, userMsg);

          updateAiMessage(aiId, {
            message: sanitized,
            meta: result.meta,
            streaming: false,
          });

          // reload sau khi backend đã lưu xong
          setTimeout(() => {
            loadHistory(false);
          }, 500);
        },
      });
    } catch {
      try {
        const fallback = await sendAiChat(accessToken, userMsg);
        setLastIntent(fallback.intent || "");
        if (fallback.products?.length) {
          setRecommendations(fallback.products);
        }
        updateAiMessage(aiId, {
          message: fallback.message,
          meta: fallback,
          streaming: false,
        });
        setTimeout(() => {
          loadHistory(false);
        }, 500);
      } catch (fallbackErr: any) {
        updateAiMessage(aiId, {
          message: fallbackErr?.message || "Không thể kết nối AI",
          streaming: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    const context = input.trim() || "gợi ý sản phẩm phù hợp";
    setRecLoading(true);
    try {
      const data = await fetchAiRecommend(accessToken, context);
      if (data?.recommendations?.length) {
        setRecommendations(data.recommendations);
        message.success("Đã cập nhật gợi ý sản phẩm");
      } else {
        message.info("Chưa có gợi ý phù hợp");
      }
    } catch (err: any) {
      message.error(err?.message || "Gợi ý thất bại");
    } finally {
      setRecLoading(false);
    }
  };

  const chatColumn = (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>{title}</span>
          {lastIntent && (
            <Tag color="processing">
              {INTENT_LABELS[lastIntent] || lastIntent}
            </Tag>
          )}
        </Space>
      }
    >
      <Space wrap style={{ marginBottom: 12 }}>
        {QUICK_PROMPTS.map((prompt) => (
          <Tag
            key={prompt}
            style={{ cursor: "pointer", padding: "4px 10px" }}
            onClick={() => sendMessage(prompt)}
          >
            {prompt}
          </Tag>
        ))}
      </Space>

      <div
        ref={chatRef}
        style={{
          height: 480,
          overflowY: "auto",
          background: "#fafafa",
          padding: 16,
          borderRadius: 12,
          border: "1px solid #f0f0f0",
        }}
      >
        {historyLoading ? (
          <div style={{ textAlign: "center", padding: 40 }}>
            <Spin tip="Đang tải lịch sử..." />
          </div>
        ) : messages.length === 0 ? (
          <Empty description="Bắt đầu trò chuyện với AI Avenza" />
        ) : (
          messages.map((item) => {
            const isUser = item.sender === "user";
            return (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  marginBottom: 14,
                  gap: 8,
                }}
              >
                {!isUser && (
                  <Avatar
                    size="small"
                    icon={<RobotOutlined />}
                    style={{ background: "#1677ff", flexShrink: 0 }}
                  />
                )}
                <div style={{ maxWidth: "78%" }}>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      background: isUser ? "#1677ff" : "#fff",
                      color: isUser ? "#fff" : "#111",
                      border: isUser ? "none" : "1px solid #eee",
                      boxShadow: isUser ? "none" : "0 1px 2px rgba(0,0,0,0.04)",
                    }}
                  >
                    {item.meta?.intent && !isUser && (
                      <Tag color="gold" style={{ marginBottom: 6 }}>
                        {INTENT_LABELS[item.meta.intent] || item.meta.intent}
                      </Tag>
                    )}
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {item.message}
                      {item.streaming && !item.message && (
                        <Text type="secondary">Đang trả lời...</Text>
                      )}
                    </div>
                    {!isUser && item.meta?.action && (
                      <Alert
                        style={{ marginTop: 8 }}
                        type={item.meta.action.success ? "success" : "warning"}
                        message={item.meta.action.message}
                        showIcon
                        icon={<ShoppingCartOutlined />}
                      />
                    )}
                    {!isUser && <ProductList products={item.meta?.products} />}
                  </div>
                </div>
                {isUser && (
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    style={{ background: "#87d068", flexShrink: 0 }}
                  />
                )}
              </div>
            );
          })
        )}
        {loading && messages[messages.length - 1]?.sender === "user" && (
          <Spin size="small" />
        )}
      </div>

      <Divider style={{ margin: "16px 0" }} />

      <Space.Compact style={{ width: "100%" }}>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPressEnter={() => sendMessage()}
          placeholder="Hỏi về sản phẩm, đơn hàng, voucher, giỏ hàng..."
          disabled={loading}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => sendMessage()}
          loading={loading}
        >
          Gửi
        </Button>
      </Space.Compact>
    </Card>
  );

  const recommendationTab = (
    <Card
      title="Gợi ý sản phẩm dành cho bạn"
      extra={
        <Button loading={recLoading} onClick={handleRecommend}>
          Làm mới
        </Button>
      }
    >
      <Button
        style={{ marginTop: 10, marginBottom: 20 }}
        loading={recLoading}
        onClick={handleRecommend}
        disabled={loading}
      >
        Gợi ý sản phẩm (AI Engine)
      </Button>
      {recommendations.length === 0 ? (
        <Empty description="Chưa có gợi ý sản phẩm" />
      ) : (
        <Row gutter={[12, 12]}>
          {recommendations.map((p) => (
            <Col span={24} key={p._id}>
              <Card size="small">
                <Text strong>{p.name}</Text>

                <div style={{ marginTop: 6 }}>
                  <Text>{formatPrice(p.price)}</Text>
                </div>

                {(p.categoryId?.name || p.category) && (
                  <Tag color="blue" style={{ marginTop: 8 }}>
                    {p.categoryId?.name || p.category}
                  </Tag>
                )}

                <div style={{ marginTop: 8 }}>
                  <Link href={`/product/${p._id}`}>Xem sản phẩm</Link>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Card>
  );

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <Tabs
        defaultActiveKey="chat"
        items={[
          {
            key: "chat",
            label: (
              <span>
                <RobotOutlined /> Chat AI
              </span>
            ),
            children: chatColumn,
          },
          {
            key: "recommend",
            label: (
              <span>
                <ShoppingCartOutlined /> Gợi ý sản phẩm
              </span>
            ),
            children: recommendationTab,
          },
        ]}
      />
    </div>
  );
};

export default AiChatPanel;
