"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, Input, Button, Space, Spin, Empty, message, Avatar } from "antd";
import { SendOutlined } from "@ant-design/icons";
import GuestLayout from "@/components/layout/guest.layout";
import chatApi from "@/utils/chat.api";
import io from "socket.io-client";

const ChatPage = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const [adminTyping, setAdminTyping] = useState(false);

  useEffect(() => {
    if (!session?.user?.access_token) return;
    loadMessages();
    const cleanup = connectSocket();
    // emit event to reset unread badge
    window.dispatchEvent(new Event("userChatViewed"));
    return cleanup;
  }, [session]);

  const loadMessages = async () => {
    if (!session?.user?.access_token) return;
    setLoading(true);
    try {
      const res = await chatApi.getMyMessages(session.user.access_token);
      const msgs = res?.data || res || [];
      setMessages(Array.isArray(msgs) ? msgs : []);
      setTimeout(() => scrollToBottom(), 100);
    } catch (e) {
      console.error("Failed to load messages", e);
    }
    setLoading(false);
  };

  const connectSocket = () => {
    try {
      const socket = io(
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
        {
          query: { userId: session?.user?._id, role: "USER" },
        },
      );

      socket.on("connect", () => {
        console.log("Chat connected");
      });

      socket.on("chat:message", (data: any) => {
        setMessages((prev) => [...prev, data]);
        scrollToBottom();
      });

      socket.on("chat:typing", (data: any) => {
        // from admin -> show typing indicator
        if (data?.from === "ADMIN" || data?.from === undefined) {
          setAdminTyping(!!data.isTyping);
        }
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
    if (!input.trim() || !session?.user?.access_token) return;

    setSending(true);
    try {
      const res = await chatApi.sendMessage(
        { message: input },
        session.user.access_token,
      );

      if (res?.data || res) {
        // append new message to UI and scroll
        const msg = res.data || res;
        setMessages((prev) => [...prev, msg]);
        setInput("");
        setTimeout(() => scrollToBottom(), 50);
      } else {
        message.error(res?.message || "Failed to send message");
      }
    } catch (e) {
      message.error("Error sending message");
      console.error(e);
    }
    setSending(false);
  };

  const handleTypingEmit = (isTyping: boolean) => {
    try {
      if (!socketRef.current) return;
      socketRef.current.emit("chat:typing", {
        userId: session?.user?._id,
        isTyping,
        role: "USER",
      });
    } catch (e) {
      // ignore
    }
  };

  if (!session) {
    return (
      <GuestLayout>
        <div style={{ textAlign: "center", padding: 40 }}>
          <p>Vui lòng đăng nhập để chat</p>
          <Button type="primary" onClick={() => router.push("/auth/login")}>
            Đăng nhập
          </Button>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          padding: "0 12px",
        }}
      >
        <Card
          title="Chat với Hỗ Trợ"
          style={{
            minHeight: "calc(100vh - 200px)",
            display: "flex",
            flexDirection: "column",
          }}
          headStyle={{
            background: "#1890ff",
            color: "#fff",
            padding: "12px 16px",
          }}
          bodyStyle={{
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: 12,
              padding: 8,
              background: "#fafafa",
              borderRadius: 8,
              minHeight: 300,
            }}
          >
            {loading ? (
              <Spin />
            ) : messages.length === 0 ? (
              <Empty description="Bắt đầu cuộc trò chuyện" />
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 12,
                    display: "flex",
                    justifyContent:
                      msg.sender === "USER" ? "flex-end" : "flex-start",
                    alignItems: "flex-end",
                    gap: 6,
                  }}
                >
                  {msg.sender === "ADMIN" && (
                    <Avatar size="small" style={{ backgroundColor: "#52c41a" }}>
                      A
                    </Avatar>
                  )}
                  <div
                    style={{
                      display: "inline-block",
                      maxWidth: "calc(100% - 40px)",
                      background: msg.sender === "USER" ? "#1890ff" : "#fff",
                      color: msg.sender === "USER" ? "#fff" : "#000",
                      padding: "8px 12px",
                      borderRadius: 12,
                      wordWrap: "break-word",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                      fontSize: "14px",
                    }}
                  >
                    <div style={{ wordBreak: "break-word" }}>{msg.message}</div>
                    <div
                      style={{
                        fontSize: 11,
                        color:
                          msg.sender === "USER"
                            ? "rgba(255,255,255,0.7)"
                            : "#999",
                        marginTop: 4,
                      }}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  {msg.sender === "USER" && (
                    <Avatar size="small" style={{ backgroundColor: "#1890ff" }}>
                      {session?.user?.name?.[0] || "U"}
                    </Avatar>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {adminTyping && (
              <div style={{ color: "#999", fontSize: 12, marginBottom: 4 }}>
                Hỗ trợ đang nhập...
              </div>
            )}
            <Space.Compact style={{ width: "100%" }} block>
              <Input
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  handleTypingEmit(true);
                  if (typingTimeoutRef.current)
                    clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = setTimeout(() => {
                    handleTypingEmit(false);
                  }, 1500);
                }}
                onPressEnter={handleSend}
                disabled={sending}
                size="large"
                style={{ fontSize: "14px" }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSend}
                loading={sending}
                size="large"
              >
                Gửi
              </Button>
            </Space.Compact>
          </div>
        </Card>
      </div>
    </GuestLayout>
  );
};

export default ChatPage;
