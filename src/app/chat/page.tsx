"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

import {
  Avatar,
  Button,
  Card,
  Empty,
  Image,
  Input,
  Popover,
  Space,
  Spin,
  message,
} from "antd";

import { PictureOutlined, SendOutlined, SmileOutlined } from "@ant-design/icons";

import GuestLayout from "@/components/layout/guest.layout";

import chatApi from "@/utils/chat.api";
import { normalizeImageUrl } from "@/utils/image";

import io from "socket.io-client";

const CHAT_EMOJIS = ["😀", "😍", "😂", "😊", "👍", "🙏", "🎉", "❤️", "🔥", "✅"];

const ChatPage = () => {
  const { data: session } = useSession();

  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);

  const [input, setInput] = useState("");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [imagePreview, setImagePreview] = useState("");

  const [loading, setLoading] = useState(false);

  const [sending, setSending] = useState(false);

  const [adminTyping, setAdminTyping] = useState(false);

  const socketRef = useRef<any>(null);

  const messageContainerRef = useRef<HTMLDivElement>(null);

  const typingTimeoutRef = useRef<any>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);

  // =========================
  // INIT
  // =========================
  useEffect(() => {
    if (!session?.user?.access_token) return;

    // tránh connect nhiều lần
    if (socketRef.current) return;

    loadMessages();

    const cleanup = connectSocket();

    window.dispatchEvent(new Event("userChatViewed"));

    return cleanup;
  }, [session]);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    scrollToBottom(false);
  }, [messages]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreview("");
      return;
    }

    const url = URL.createObjectURL(selectedImage);
    setImagePreview(url);

    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  const scrollToBottom = (smooth = true) => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTo({
        top: messageContainerRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "auto",
      });
    }
  };

  // =========================
  // LOAD MESSAGES
  // =========================
  const loadMessages = async () => {
    if (!session?.user?.access_token) return;

    setLoading(true);

    try {
      const res = await chatApi.getMyMessages(session.user.access_token);

      const msgs = res?.data || res || [];

      setMessages(Array.isArray(msgs) ? msgs : []);

      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    } catch (e) {
      console.error("Failed to load messages", e);
    }

    setLoading(false);
  };

  // =========================
  // SOCKET
  // =========================
  const connectSocket = () => {
    try {
      if (socketRef.current?.connected) return;

      const socket = io(
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
        {
          transports: ["websocket"],

          query: {
            userId: session?.user?._id,
            role: "USER",
          },
        },
      );

      socket.on("connect", () => {
        console.log("Chat connected");
      });

      socket.on("disconnect", () => {
        console.log("Chat disconnected");
      });

      // =========================
      // RECEIVE MESSAGE
      // =========================
      socket.on("chat:message", (data: any) => {
        setMessages((prev) => {
          // check duplicate mạnh hơn
          const existed = prev.some((m) => {
            // duplicate theo _id
            if (data?._id && m?._id === data._id) {
              return true;
            }

            // duplicate theo tempId
            if (data?.tempId && m?._tempId === data.tempId) {
              return true;
            }

            // duplicate theo content + time
            if (m.message === data.message && m.sender === data.sender) {
              const oldTime = new Date(m.createdAt).getTime();

              const newTime = new Date(data.createdAt).getTime();

              if (Math.abs(oldTime - newTime) < 3000) {
                return true;
              }
            }

            return false;
          });

          // replace temp message
          if (data?.tempId) {
            return prev.map((m) =>
              m._tempId === data.tempId
                ? {
                    ...data,
                    pending: false,
                  }
                : m,
            );
          }

          // nếu đã tồn tại thì bỏ qua
          if (existed) {
            return prev;
          }

          // add message mới
          return [...prev, data];
        });

        if (data?.sender === "ADMIN") {
          socket.emit("chat:read", {
            userId: session?.user?._id,
            role: "USER",
          });
        }

        setTimeout(() => {
          scrollToBottom();
        }, 50);
      });

      socket.on("chat:read", (data: any) => {
        if (data?.reader !== "ADMIN") return;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === "USER" ? { ...msg, readByAdmin: true } : msg,
          ),
        );
      });

      // =========================
      // TYPING
      // =========================
      socket.on("chat:typing", (data: any) => {
        if (data?.from === "ADMIN" || data?.from === undefined) {
          setAdminTyping(!!data.isTyping);
        }
      });

      socketRef.current = socket;

      socket.emit("chat:read", {
        userId: session?.user?._id,
        role: "USER",
      });

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (e) {
      console.error("Socket connection failed", e);
    }
  };

  // =========================
  // SEND MESSAGE
  // =========================
  const handleSend = async () => {
    // chống spam enter
    if (sending) return;

    if ((!input.trim() && !selectedImage) || !session?.user?.access_token) {
      return;
    }

    setSending(true);

    try {
      const currentInput = input.trim();
      const imageFile = selectedImage;
      let imageUrl = "";

      if (imageFile) {
        const uploadRes = await chatApi.uploadImage(
          imageFile,
          session.user.access_token,
        );
        imageUrl = uploadRes?.data?.url || uploadRes?.url || "";
        if (!imageUrl) {
          throw new Error("Upload image failed");
        }
      }

      const tempId = `t-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 9)}`;

      // temp message
      const tempMsg = {
        _tempId: tempId,
        message: currentInput,
        imageUrl,
        sender: "USER",
        createdAt: new Date().toISOString(),
        pending: true,
      };

      // add local message
      setMessages((prev) => [...prev, tempMsg]);

      setInput("");
      setSelectedImage(null);

      setTimeout(() => {
        scrollToBottom();
      }, 50);

      const res = await chatApi.sendMessage(
        {
          message: currentInput,
          imageUrl,
          tempId,
        },
        session.user.access_token,
      );

      // fail
      if (!(res?.data || res)) {
        setMessages((prev) => prev.filter((m) => m._tempId !== tempId));

        message.error(res?.message || "Failed to send message");
      }
    } catch (e) {
      console.error(e);

      message.error("Error sending message");
    }

    setSending(false);
  };

  // =========================
  // TYPING EMIT
  // =========================
  const handleTypingEmit = (isTyping: boolean) => {
    try {
      if (!socketRef.current) return;

      socketRef.current.emit("chat:typing", {
        userId: session?.user?._id,
        isTyping,
        role: "USER",
      });
    } catch (e) {}
  };

  const handlePickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Vui lòng chọn file ảnh");
      return;
    }

    setSelectedImage(file);
  };

  const emojiContent = (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 32px)",
        gap: 6,
      }}
    >
      {CHAT_EMOJIS.map((emoji) => (
        <Button
          key={emoji}
          type="text"
          onClick={() => setInput((prev) => `${prev}${emoji}`)}
          style={{ fontSize: 18, padding: 0 }}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );

  // =========================
  // NOT LOGIN
  // =========================
  if (!session) {
    return (
      <GuestLayout>
        <div
          style={{
            textAlign: "center",
            padding: 40,
          }}
        >
          <p>Vui lòng đăng nhập để chat</p>

          <Button type="primary" onClick={() => router.push("/auth/login")}>
            Đăng nhập
          </Button>
        </div>
      </GuestLayout>
    );
  }

  // =========================
  // UI
  // =========================
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
            height: "80vh",
          }}
          headStyle={{
            background: "#1890ff",
            color: "#fff",
          }}
          bodyStyle={{
            height: "calc(80vh - 60px)",
            display: "flex",
            flexDirection: "column",
            padding: 16,
          }}
        >
          {/* MESSAGES */}
          <div
            ref={messageContainerRef}
            style={{
              flex: 1,
              overflowY: "auto",
              marginBottom: 12,
              padding: 12,
              background: "#fafafa",
              borderRadius: 12,
              scrollBehavior: "smooth",
            }}
          >
            {loading ? (
              <Spin />
            ) : messages.length === 0 ? (
              <Empty description="Bắt đầu cuộc trò chuyện" />
            ) : (
              <>
                {messages.map((msg, index) => (
                  <div
                    key={msg._id || msg._tempId || `${msg.createdAt}-${index}`}
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
                      <Avatar
                        size="small"
                        style={{
                          backgroundColor: "#52c41a",
                        }}
                      >
                        A
                      </Avatar>
                    )}

                    <div
                      style={{
                        display: "inline-block",
                        maxWidth: "75%",
                        background: msg.sender === "USER" ? "#1890ff" : "#fff",
                        color: msg.sender === "USER" ? "#fff" : "#000",
                        padding: "10px 14px",
                        borderRadius: 14,
                        wordBreak: "break-word",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                        opacity: msg.pending ? 0.7 : 1,
                      }}
                    >
                      {msg.imageUrl && (
                        <Image
                          src={normalizeImageUrl(msg.imageUrl)}
                          alt="Chat image"
                          style={{
                            maxWidth: 220,
                            borderRadius: 10,
                            display: "block",
                            marginBottom: msg.message ? 8 : 0,
                          }}
                        />
                      )}

                      {msg.message && (
                        <div
                          style={{
                            wordBreak: "break-word",
                            lineHeight: 1.5,
                          }}
                        >
                          {msg.message}
                        </div>
                      )}

                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 6,
                          opacity: 0.7,
                        }}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>

                    {msg.sender === "USER" && (
                      <Avatar
                        size="small"
                        style={{
                          backgroundColor: "#1890ff",
                        }}
                      >
                        {session?.user?.name?.[0] || "U"}
                      </Avatar>
                    )}
                  </div>
                ))}

                {adminTyping && (
                  <div
                    style={{
                      color: "#999",
                      fontSize: 12,
                      marginTop: 4,
                    }}
                  >
                    Hỗ trợ đang nhập...
                  </div>
                )}
              </>
            )}
          </div>

          {/* INPUT */}
          {imagePreview && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
                padding: 8,
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                background: "#fff",
              }}
            >
              <Image
                src={imagePreview}
                alt="Anh da chon"
                width={72}
                height={72}
                style={{ objectFit: "cover", borderRadius: 8 }}
              />
              <Button size="small" onClick={() => setSelectedImage(null)}>
                Bo anh
              </Button>
            </div>
          )}

          <Space.Compact
            style={{
              width: "100%",
            }}
            block
          >
            <Button
              icon={<PictureOutlined />}
              size="large"
              disabled={sending}
              onClick={() => imageInputRef.current?.click()}
            />

            <Popover content={emojiContent} trigger="click">
              <Button icon={<SmileOutlined />} size="large" disabled={sending} />
            </Popover>

            <Input
              placeholder="Nhập tin nhắn..."
              value={input}
              disabled={sending}
              size="large"
              style={{
                fontSize: 14,
              }}
              onChange={(e) => {
                setInput(e.target.value);

                handleTypingEmit(true);

                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                }

                typingTimeoutRef.current = setTimeout(() => {
                  handleTypingEmit(false);
                }, 1500);
              }}
              onPressEnter={handleSend}
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

          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handlePickImage}
          />
        </Card>
      </div>
    </GuestLayout>
  );
};

export default ChatPage;
