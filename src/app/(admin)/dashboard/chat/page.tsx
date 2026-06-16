"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Avatar,
  Badge,
  Button,
  Empty,
  Image,
  Input,
  message,
  Popover,
  Spin,
  Tooltip,
} from "antd";
import {
  CheckCircleOutlined,
  PictureOutlined,
  SearchOutlined,
  SendOutlined,
  SmileOutlined,
} from "@ant-design/icons";
import chatApi from "@/utils/chat.api";
import { normalizeImageUrl } from "@/utils/image";
import io from "socket.io-client";

const CHAT_EMOJIS = ["😀", "😍", "😂", "😊", "👍", "🙏", "🎉", "❤️", "🔥", "✅"];

const formatTime = (value?: string) => {
  if (!value) return "";

  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatThreadTime = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};

const getUserName = (thread: any) =>
  thread?.user?.name || thread?.user?.email || "Khach hang";

const AdminChatPage = () => {
  const { data: session } = useSession();

  const [threads, setThreads] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const selectedUserIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [search, setSearch] = useState("");
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [userTyping, setUserTyping] = useState(false);

  const socketRef = useRef<any>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.userId === selectedUserId),
    [threads, selectedUserId],
  );

  const filteredThreads = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return threads;

    return threads.filter((thread) => {
      const name = getUserName(thread).toLowerCase();
      const email = thread?.user?.email?.toLowerCase() || "";
      const lastMessage = thread?.lastMessage?.toLowerCase() || "";

      return (
        name.includes(keyword) ||
        email.includes(keyword) ||
        lastMessage.includes(keyword)
      );
    });
  }, [threads, search]);

  const latestAdminMessageId = useMemo(() => {
    const lastAdminMessage = [...messages]
      .reverse()
      .find((msg) => msg.sender === "ADMIN");

    return lastAdminMessage?._id || lastAdminMessage?._tempId || null;
  }, [messages]);

  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    if (!session?.user?.access_token) return;

    loadThreads();
    const cleanup = connectSocket();

    window.dispatchEvent(new Event("chatViewed"));

    return cleanup;
  }, [session?.user?.access_token]);

  useEffect(() => {
    if (threads.length > 0 && !selectedUserId) {
      setSelectedUserId(threads[0].userId);
    }

    if (selectedUserId && !threads.find((t) => t.userId === selectedUserId)) {
      setSelectedUserId(null);
      setMessages([]);
    }
  }, [threads, selectedUserId]);

  useEffect(() => {
    if (!selectedUserId) return;

    loadMessages(selectedUserId);
  }, [selectedUserId]);

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
    messageContainerRef.current?.scrollTo({
      top: messageContainerRef.current.scrollHeight,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  const markThreadReadLocal = (userId: string) => {
    setThreads((prev) =>
      prev.map((thread) =>
        thread.userId === userId ? { ...thread, unreadCount: 0 } : thread,
      ),
    );
  };

  const emitAdminRead = (userId: string) => {
    socketRef.current?.emit("chat:read", {
      userId,
      role: "ADMIN",
    });
  };

  const loadThreads = async () => {
    if (!session?.user?.access_token) return;

    setLoadingThreads(true);

    try {
      const res = await chatApi.getThreads(session.user.access_token);
      const data = res?.data || res || [];

      setThreads(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load threads", e);
    } finally {
      setLoadingThreads(false);
    }
  };

  const loadMessages = async (userId: string) => {
    if (!session?.user?.access_token) return;

    setLoadingMessages(true);
    setUserTyping(false);

    try {
      const res = await chatApi.getByUser(userId, session.user.access_token);
      const msgs = res?.data || res || [];

      setMessages(Array.isArray(msgs) ? msgs : []);
      markThreadReadLocal(userId);
      emitAdminRead(userId);

      setTimeout(() => {
        scrollToBottom(false);
      }, 100);
    } catch (e) {
      console.error("Failed to load messages", e);
    } finally {
      setLoadingMessages(false);
    }
  };

  const connectSocket = () => {
    try {
      const socket = io(
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
        {
          transports: ["websocket"],
          query: {
            userId: session?.user?._id,
            role: "ADMIN",
          },
        },
      );

      socket.on("chat:message", (data: any) => {
        const activeUserId = selectedUserIdRef.current;

        if (activeUserId && data.userId === activeUserId) {
          setMessages((prev) => {
            if (data?._id && prev.some((m) => m._id === data._id)) {
              return prev;
            }

            return [...prev, { ...data, readByAdmin: true }];
          });

          markThreadReadLocal(activeUserId);
          emitAdminRead(activeUserId);

          setTimeout(() => {
            scrollToBottom();
          }, 50);
        }

        loadThreads();
      });

      socket.on("chat:read", (data: any) => {
        if (!data?.userId) return;

        if (data.reader === "ADMIN") {
          markThreadReadLocal(data.userId);
        }

        if (
          data.reader === "USER" &&
          data.userId === selectedUserIdRef.current
        ) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.sender === "ADMIN" ? { ...msg, readByUser: true } : msg,
            ),
          );
        }
      });

      socket.on("chat:typing", (data: any) => {
        if (data?.userId && selectedUserIdRef.current === data.userId) {
          setUserTyping(!!data.isTyping);
        }
      });

      socket.on("chat:threads", (data: any) => {
        setThreads(Array.isArray(data) ? data : []);
      });

      socketRef.current = socket;

      return () => {
        socket.disconnect();
        socketRef.current = null;
      };
    } catch (e) {
      console.error("Socket connection failed", e);
    }
  };

  const handleSelectThread = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedImage(null);
    markThreadReadLocal(userId);
  };

  const handleSend = async () => {
    if (
      (!input.trim() && !selectedImage) ||
      !selectedUserId ||
      !session?.user?.access_token
    ) {
      return;
    }

    setSending(true);

    const currentInput = input.trim();
    const imageFile = selectedImage;
    let imageUrl = "";

    try {
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
    } catch (e) {
      console.error(e);
      message.error("Upload anh that bai");
      setSending(false);
      return;
    }

    const tempId = `admin-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const tempMessage = {
      _tempId: tempId,
      userId: selectedUserId,
      sender: "ADMIN",
      message: currentInput,
      imageUrl,
      createdAt: new Date().toISOString(),
      readByUser: false,
      pending: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInput("");
    setSelectedImage(null);

    setTimeout(() => {
      scrollToBottom();
    }, 50);

    try {
      const res = await chatApi.sendMessage(
        {
          message: currentInput,
          imageUrl,
          userId: selectedUserId,
          tempId,
        },
        session.user.access_token,
      );

      const msg = res?.data || res;

      if (msg?._id) {
        setMessages((prev) =>
          prev.map((item) =>
            item._tempId === tempId
              ? { ...msg, userId: selectedUserId, pending: false }
              : item,
          ),
        );

        loadThreads();
      } else {
        setMessages((prev) => prev.filter((item) => item._tempId !== tempId));
        message.error(res?.message || "Khong gui duoc tin nhan");
      }
    } catch (e) {
      console.error(e);
      setMessages((prev) => prev.filter((item) => item._tempId !== tempId));
      message.error("Loi khi gui tin nhan");
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (value: string) => {
    setInput(value);

    if (socketRef.current && selectedUserId) {
      socketRef.current.emit("chat:typing", {
        userId: selectedUserId,
        isTyping: true,
        role: "ADMIN",
      });
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (socketRef.current && selectedUserId) {
        socketRef.current.emit("chat:typing", {
          userId: selectedUserId,
          isTyping: false,
          role: "ADMIN",
        });
      }
    }, 1200);
  };

  const handlePickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      message.error("Vui long chon file anh");
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

  return (
    <div
      style={{
        height: "calc(100vh - 96px)",
        minHeight: 620,
        display: "grid",
        gridTemplateColumns: "340px minmax(0, 1fr)",
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          borderRight: "1px solid #e5e7eb",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #eef0f3" }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              marginBottom: 12,
              color: "#111827",
            }}
          >
            Ho tro chat
          </div>

          <Input
            allowClear
            prefix={<SearchOutlined style={{ color: "#8b949e" }} />}
            placeholder="Tim khach hang hoac tin nhan"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            style={{ borderRadius: 18 }}
          />
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
          {loadingThreads ? (
            <div style={{ padding: 24, textAlign: "center" }}>
              <Spin />
            </div>
          ) : filteredThreads.length === 0 ? (
            <Empty description="Chua co hoi thoai" style={{ marginTop: 48 }} />
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedUserId === thread.userId;
              const unreadCount = Number(thread.unreadCount || 0);
              const hasUnread = unreadCount > 0;

              return (
                <button
                  key={thread.userId}
                  type="button"
                  onClick={() => handleSelectThread(thread.userId)}
                  style={{
                    width: "100%",
                    border: 0,
                    cursor: "pointer",
                    background: isSelected ? "#eef5ff" : "transparent",
                    borderRadius: 8,
                    padding: "10px 8px",
                    marginBottom: 4,
                    display: "grid",
                    gridTemplateColumns: "44px minmax(0, 1fr) auto",
                    gap: 10,
                    alignItems: "center",
                    textAlign: "left",
                  }}
                >
                  <Badge dot={hasUnread} offset={[-2, 34]}>
                    <Avatar
                      size={44}
                      style={{
                        backgroundColor: hasUnread ? "#1677ff" : "#8c8c8c",
                        fontWeight: 700,
                      }}
                    >
                      {getUserName(thread)[0]?.toUpperCase() || "U"}
                    </Avatar>
                  </Badge>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: hasUnread ? 800 : 600,
                          color: "#111827",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {getUserName(thread)}
                      </div>
                    </div>

                    <div
                      style={{
                        marginTop: 2,
                        fontSize: 13,
                        color: hasUnread ? "#111827" : "#6b7280",
                        fontWeight: hasUnread ? 700 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {thread.lastSender === "ADMIN" ? "Ban: " : ""}
                      {thread.lastMessage || (thread.lastImageUrl ? "Anh" : "Tin nhan moi")}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: hasUnread ? "#1677ff" : "#8c8c8c",
                        fontWeight: hasUnread ? 700 : 400,
                      }}
                    >
                      {formatThreadTime(thread.lastCreatedAt)}
                    </span>

                    {hasUnread && (
                      <Badge
                        count={unreadCount}
                        style={{ backgroundColor: "#1677ff" }}
                      />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          background: "#f7f8fb",
        }}
      >
        {selectedUserId ? (
          <>
            <header
              style={{
                height: 64,
                background: "#fff",
                borderBottom: "1px solid #e5e7eb",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Avatar size={42} style={{ backgroundColor: "#1677ff" }}>
                {getUserName(selectedThread)[0]?.toUpperCase() || "U"}
              </Avatar>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 15,
                    color: "#111827",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {getUserName(selectedThread)}
                </div>

                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  {userTyping ? "Dang nhap..." : selectedThread?.user?.email}
                </div>
              </div>
            </header>

            <section
              ref={messageContainerRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: 18,
              }}
            >
              {loadingMessages ? (
                <div style={{ paddingTop: 80, textAlign: "center" }}>
                  <Spin />
                </div>
              ) : messages.length === 0 ? (
                <Empty
                  description="Chua co tin nhan"
                  style={{ marginTop: 96 }}
                />
              ) : (
                messages.map((msg, index) => {
                  const isAdmin = msg.sender === "ADMIN";
                  const messageId = msg._id || msg._tempId;
                  const showSeen =
                    isAdmin &&
                    messageId === latestAdminMessageId &&
                    msg.readByUser;

                  return (
                    <div
                      key={messageId || `${msg.createdAt}-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: isAdmin ? "flex-end" : "flex-start",
                        marginBottom: showSeen ? 4 : 12,
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "68%",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: isAdmin ? "flex-end" : "flex-start",
                        }}
                      >
                        <div
                          style={{
                            background: isAdmin ? "#1677ff" : "#fff",
                            color: isAdmin ? "#fff" : "#111827",
                            border: isAdmin
                              ? "1px solid #1677ff"
                              : "1px solid #e5e7eb",
                            padding: "9px 12px",
                            borderRadius: isAdmin
                              ? "16px 16px 4px 16px"
                              : "16px 16px 16px 4px",
                            boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
                            wordBreak: "break-word",
                            opacity: msg.pending ? 0.65 : 1,
                            fontWeight:
                              !isAdmin && msg.readByAdmin === false ? 700 : 400,
                          }}
                        >
                          {msg.imageUrl && (
                            <Image
                              src={normalizeImageUrl(msg.imageUrl)}
                              alt="Chat image"
                              style={{
                                maxWidth: 240,
                                borderRadius: 10,
                                display: "block",
                                marginBottom: msg.message ? 8 : 0,
                              }}
                            />
                          )}

                          {msg.message}
                        </div>

                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 11,
                            color: "#8c8c8c",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <span>{formatTime(msg.createdAt)}</span>
                          {msg.pending && <span>Dang gui</span>}
                        </div>

                        {showSeen && (
                          <Tooltip title="Khach hang da xem tin nhan">
                            <div
                              style={{
                                marginTop: 2,
                                fontSize: 11,
                                color: "#6b7280",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <CheckCircleOutlined />
                              <span>Da xem</span>
                            </div>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })
              )}

              {userTyping && (
                <div style={{ color: "#6b7280", fontSize: 12 }}>
                  Khach hang dang nhap...
                </div>
              )}
            </section>

            <footer
              style={{
                background: "#fff",
                borderTop: "1px solid #e5e7eb",
                padding: 12,
              }}
            >
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
                    alt="Selected image"
                    width={72}
                    height={72}
                    style={{ objectFit: "cover", borderRadius: 8 }}
                  />
                  <Button size="small" onClick={() => setSelectedImage(null)}>
                    Bo anh
                  </Button>
                </div>
              )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "42px 42px minmax(0, 1fr) 42px",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Button
                  icon={<PictureOutlined />}
                  shape="circle"
                  size="large"
                  disabled={sending}
                  onClick={() => imageInputRef.current?.click()}
                />

                <Popover content={emojiContent} trigger="click">
                  <Button
                    icon={<SmileOutlined />}
                    shape="circle"
                    size="large"
                    disabled={sending}
                  />
                </Popover>

                <Input
                  size="large"
                  placeholder="Nhap tin nhan..."
                  value={input}
                  disabled={sending}
                  onChange={(event) => handleTyping(event.target.value)}
                  onPressEnter={handleSend}
                  style={{
                    borderRadius: 20,
                    background: "#f3f4f6",
                    borderColor: "#f3f4f6",
                  }}
                />

                <Button
                  type="primary"
                  shape="circle"
                  icon={<SendOutlined />}
                  loading={sending}
                  onClick={handleSend}
                  size="large"
                />
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePickImage}
              />
            </footer>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#fff",
            }}
          >
            <Empty description="Chon mot hoi thoai de bat dau" />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminChatPage;
