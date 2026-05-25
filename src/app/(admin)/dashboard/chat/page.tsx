"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Row,
  Col,
  Card,
  List,
  Input,
  Button,
  Space,
  Spin,
  Empty,
  message,
  Badge,
} from "antd";
import { SendOutlined } from "@ant-design/icons";
import chatApi from "@/utils/chat.api";
import io from "socket.io-client";
import Avatar from "antd/es/avatar";

const AdminChatPage = () => {
  const { data: session } = useSession();
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const [userTyping, setUserTyping] = useState(false);

  useEffect(() => {
    if (!session?.user?.access_token) return;
    loadThreads();
    connectSocket();
  }, [session]);

  // auto-select first thread when threads load
  useEffect(() => {
    if (!session?.user?.access_token) return;
    if (threads.length > 0 && !selectedUserId) {
      setSelectedUserId(threads[0].userId);
    }
    // if the selected user no longer exists in threads, reset selection
    if (selectedUserId && !threads.find((t) => t.userId === selectedUserId)) {
      setSelectedUserId(null);
      setMessages([]);
    }
  }, [threads, session, selectedUserId]);

  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId]);

  // emit event to reset badge when admin views chat page
  useEffect(() => {
    window.dispatchEvent(new Event("chatViewed"));
  }, []);

  const loadThreads = async () => {
    if (!session?.user?.access_token) return;
    setLoading(true);
    try {
      const res = await chatApi.getThreads(session.user.access_token);
      const data = res?.data || res || [];
      setThreads(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load threads", e);
    }
    setLoading(false);
  };

  const loadMessages = async (userId: string) => {
    if (!session?.user?.access_token) return;
    try {
      const res = await chatApi.getByUser(userId, session.user.access_token);
      const msgs = res?.data || res || [];
      setMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => scrollToBottom(), 100);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  };

  const connectSocket = () => {
    try {
      const socket = io(
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
        {
          query: { userId: session?.user?._id, role: "ADMIN" },
        },
      );

      socket.on("connect", () => {
        console.log("Admin chat connected");
      });

      socket.on("chat:message", (data: any) => {
        try {
          if (selectedUserId && data.userId === selectedUserId) {
            setMessages((prev) => {
              try {
                if (data?._id && prev.some((m) => m._id === data._id)) {
                  return prev;
                }
              } catch (e) {
                // ignore
              }
              return [...prev, data];
            });
            scrollToBottom();
          }
        } catch (e) {
          // ignore
        }

        loadThreads();
      });

      socket.on("chat:typing", (data: any) => {
        // data = { userId, isTyping } from user
        if (data?.userId && selectedUserId && data.userId === selectedUserId) {
          setUserTyping(!!data.isTyping);
        }
        // also allow direct admin-targeted pings (from server) but we ignore here
      });

      socket.on("chat:threads", (data: any) => {
        setThreads(data);
      });

      socketRef.current = socket;

      return () => {
        socket.disconnect();
      };
    } catch (e) {
      console.error("Socket connection failed", e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedUserId || !session?.user?.access_token)
      return;

    setSending(true);
    try {
      const res = await chatApi.sendMessage(
        { message: input, userId: selectedUserId },
        session.user.access_token,
      );

      if (res?.data || res) {
        const msg = res.data || res;
        setMessages((prev) => [...prev, msg]);
        setInput("");
        setTimeout(() => scrollToBottom(), 50);
        loadThreads();
      } else {
        message.error(res?.message || "Failed to send message");
      }
    } catch (e) {
      message.error("Error sending message");
      console.error(e);
    }
    setSending(false);
  };

  return (
    <div style={{ padding: "12px" }}>
      <h2 style={{ marginBottom: "16px" }}>Hỗ Trợ Khách Hàng</h2>

      <Row gutter={[12, 12]} style={{ minHeight: "calc(100vh - 150px)" }}>
        {/* Thread List */}
        <Col xs={24} sm={24} md={8}>
          <Card title="Conversations" loading={loading}>
            {threads.length === 0 ? (
              <Empty description="No conversations" />
            ) : (
              <List
                dataSource={threads}
                renderItem={(thread: any) => (
                  <List.Item
                    onClick={() => setSelectedUserId(thread.userId)}
                    style={{
                      cursor: "pointer",
                      background:
                        selectedUserId === thread.userId
                          ? "#e6f7ff"
                          : "transparent",
                      padding: 12,
                      borderRadius: 8,
                      marginBottom: 8,
                      border:
                        selectedUserId === thread.userId
                          ? "1px solid #1890ff"
                          : "none",
                      transition: "all 0.3s",
                    }}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: "#1890ff" }}>
                          {thread.user?.name?.[0] || "U"}
                        </Avatar>
                      }
                      title={
                        <Space>
                          <span style={{ fontWeight: 600 }}>
                            {thread.user?.name || "Unknown"}
                          </span>
                          {thread.unreadCount > 0 && (
                            <Badge
                              count={thread.unreadCount}
                              style={{ backgroundColor: "#ff4d4f" }}
                            />
                          )}
                        </Space>
                      }
                      description={
                        <div style={{ fontSize: 12, color: "#666" }}>
                          <div style={{ marginBottom: 4 }}>
                            {thread.lastMessage?.slice(0, 40)}...
                          </div>
                          <div style={{ color: "#999" }}>
                            {new Date(thread.lastCreatedAt).toLocaleString(
                              "vi-VN",
                            )}
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        {/* Chat View */}
        <Col xs={24} sm={16}>
          <Card
            title={
              selectedUserId
                ? `Chat with ${
                    threads.find((t) => t.userId === selectedUserId)?.user
                      ?.name || "User"
                  }`
                : "Select a conversation"
            }
            style={{ minHeight: 600, display: "flex", flexDirection: "column" }}
          >
            {!selectedUserId ? (
              <Empty description="Select a conversation to start" />
            ) : (
              <>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    marginBottom: 16,
                    padding: 12,
                    background: "#fafafa",
                    borderRadius: 8,
                  }}
                >
                  {userTyping && (
                    <div
                      style={{ color: "#999", fontSize: 12, marginBottom: 8 }}
                    >
                      Người dùng đang nhập...
                    </div>
                  )}
                  {messages.map((msg, i) => (
                    <div
                      key={msg._id || i}
                      style={{
                        marginBottom: 12,
                        textAlign: msg.sender === "ADMIN" ? "right" : "left",
                      }}
                    >
                      <div
                        style={{
                          display: "inline-block",
                          maxWidth: "70%",
                          background:
                            msg.sender === "ADMIN" ? "#52c41a" : "#fff",
                          color: msg.sender === "ADMIN" ? "#fff" : "#000",
                          padding: "8px 12px",
                          borderRadius: 8,
                          wordWrap: "break-word",
                        }}
                      >
                        {msg.message}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#999",
                          marginTop: 4,
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Gõ trả lời..."
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // emit typing true and debounce false
                      try {
                        if (socketRef.current && selectedUserId) {
                          socketRef.current.emit("chat:typing", {
                            userId: selectedUserId,
                            isTyping: true,
                            role: "ADMIN",
                          });
                        }
                      } catch (err) {}
                      if (typingTimeoutRef.current)
                        clearTimeout(typingTimeoutRef.current);
                      typingTimeoutRef.current = setTimeout(() => {
                        try {
                          if (socketRef.current && selectedUserId) {
                            socketRef.current.emit("chat:typing", {
                              userId: selectedUserId,
                              isTyping: false,
                              role: "ADMIN",
                            });
                          }
                        } catch (err) {}
                      }, 1200);
                    }}
                    onPressEnter={handleSend}
                    disabled={sending}
                  />
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSend}
                    loading={sending}
                  >
                    Gửi
                  </Button>
                </Space.Compact>
              </>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminChatPage;
