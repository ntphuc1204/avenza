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
  const [userTyping, setUserTyping] = useState(false);

  const socketRef = useRef<any>(null);

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!session?.user?.access_token) return;

    loadThreads();

    connectSocket();
  }, [session]);

  // auto select first thread
  useEffect(() => {
    if (!session?.user?.access_token) return;

    if (threads.length > 0 && !selectedUserId) {
      setSelectedUserId(threads[0].userId);
    }

    if (selectedUserId && !threads.find((t) => t.userId === selectedUserId)) {
      setSelectedUserId(null);
      setMessages([]);
    }
  }, [threads, session, selectedUserId]);

  // load messages
  useEffect(() => {
    if (selectedUserId) {
      loadMessages(selectedUserId);
    }
  }, [selectedUserId]);

  // auto scroll newest message
  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  // reset badge
  useEffect(() => {
    window.dispatchEvent(new Event("chatViewed"));
  }, []);

  const scrollToBottom = (smooth = true) => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

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

      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
  };

  const connectSocket = () => {
    try {
      const socket = io(
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
        {
          query: {
            userId: session?.user?._id,
            role: "ADMIN",
          },
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
              } catch (e) {}

              return [...prev, data];
            });

            setTimeout(() => {
              scrollToBottom();
            }, 50);
          }
        } catch (e) {}

        loadThreads();
      });

      socket.on("chat:typing", (data: any) => {
        if (data?.userId && selectedUserId === data.userId) {
          setUserTyping(!!data.isTyping);
        }
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

  const handleSend = async () => {
    if (!input.trim() || !selectedUserId || !session?.user?.access_token)
      return;

    setSending(true);

    try {
      const res = await chatApi.sendMessage(
        {
          message: input,
          userId: selectedUserId,
        },
        session.user.access_token,
      );

      if (res?.data || res) {
        const msg = res.data || res;

        setMessages((prev) => [...prev, msg]);

        setInput("");

        setTimeout(() => {
          scrollToBottom();
        }, 50);

        loadThreads();
      } else {
        message.error(res?.message || "Failed to send message");
      }
    } catch (e) {
      console.error(e);

      message.error("Error sending message");
    }

    setSending(false);
  };

  return (
    <div style={{ padding: 12 }}>
      <h2 style={{ marginBottom: 16 }}>Hỗ Trợ Khách Hàng</h2>

      <Row gutter={[12, 12]}>
        {/* THREADS */}
        <Col xs={24} sm={24} md={8}>
          <Card
            title="Conversations"
            loading={loading}
            style={{
              height: "80vh",
              overflow: "hidden",
            }}
            bodyStyle={{
              height: "calc(80vh - 60px)",
              overflowY: "auto",
            }}
          >
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
                          : "1px solid transparent",
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
                              style={{
                                backgroundColor: "#ff4d4f",
                              }}
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

        {/* CHAT */}
        <Col xs={24} sm={24} md={16}>
          <Card
            title={
              selectedUserId
                ? `Chat with ${
                    threads.find((t) => t.userId === selectedUserId)?.user
                      ?.name || "User"
                  }`
                : "Select a conversation"
            }
            style={{
              height: "80vh",
            }}
            bodyStyle={{
              height: "calc(80vh - 60px)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {!selectedUserId ? (
              <Empty description="Select a conversation to start" />
            ) : (
              <>
                {/* MESSAGES */}
                <div
                  ref={messageContainerRef}
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    background: "#fafafa",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 16,
                    scrollBehavior: "smooth",
                  }}
                >
                  {userTyping && (
                    <div
                      style={{
                        color: "#999",
                        fontSize: 12,
                        marginBottom: 8,
                      }}
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
                          borderRadius: 12,
                          wordBreak: "break-word",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                        }}
                      >
                        {msg.message}
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: "#999",
                          marginTop: 4,
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>

                {/* INPUT */}
                <Space.Compact style={{ width: "100%" }}>
                  <Input
                    placeholder="Gõ trả lời..."
                    value={input}
                    disabled={sending}
                    onChange={(e) => {
                      setInput(e.target.value);

                      try {
                        if (socketRef.current && selectedUserId) {
                          socketRef.current.emit("chat:typing", {
                            userId: selectedUserId,
                            isTyping: true,
                            role: "ADMIN",
                          });
                        }
                      } catch (err) {}

                      if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                      }

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
