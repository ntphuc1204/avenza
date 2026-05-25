"use client";

import {
  AppstoreOutlined,
  BellOutlined,
  GiftOutlined,
  HomeOutlined,
  RobotOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";

import {
  Badge,
  Button,
  Drawer,
  Input,
  Layout,
  Space,
  Typography,
  Grid,
} from "antd";

import Link from "next/link";

import { signOut, useSession } from "next-auth/react";

import { useRouter, useSearchParams } from "next/navigation";

import { useEffect, useRef, useState } from "react";

import { sendRequest } from "@/utils/api";
import { io, Socket } from "socket.io-client";

const { Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const GuestHeader = () => {
  const { data: session } = useSession();

  const router = useRouter();

  const searchParams = useSearchParams();

  const screens = useBreakpoint();

  const [search, setSearch] = useState("");

  const [notificationCount, setNotificationCount] = useState(0);

  const [openDrawer, setOpenDrawer] = useState(false);

  const [cartCount, setCartCount] = useState(0);

  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const loadNotificationCount = async () => {
      if (!session?.user?.access_token) {
        setNotificationCount(0);
        return;
      }

      const res = await sendRequest<IBackendRes<{ count: number }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notifications/unread-count`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
      });

      setNotificationCount(res?.data?.count ?? 0);
    };

    const loadCartCount = async () => {
      if (!session?.user?.access_token) {
        setCartCount(0);
        return;
      }

      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
      });

      const items = res?.data?.items || [];

      const total = items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0,
      );

      setCartCount(total);
    };

    const handleNotificationsRead = () => {
      loadNotificationCount();
    };

    const handleCartUpdated = () => {
      loadCartCount();
    };

    const handleUserChatViewed = () => {
      setChatUnreadCount(0);
    };

    // RUN
    loadNotificationCount();

    loadCartCount();

    // EVENTS
    window.addEventListener("notificationsRead", handleNotificationsRead);

    window.addEventListener("cartUpdated", handleCartUpdated);

    window.addEventListener("userChatViewed", handleUserChatViewed);

    return () => {
      window.removeEventListener("notificationsRead", handleNotificationsRead);

      window.removeEventListener("cartUpdated", handleCartUpdated);

      window.removeEventListener("userChatViewed", handleUserChatViewed);
    };
  }, [session]);

  useEffect(() => {
    if (!session?.user?.access_token) return;

    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080",
      {
        transports: ["websocket"],
        query: { userId: session.user._id, role: "USER" },
      },
    );

    socketRef.current = socket;

    socket.on("notification-created", (item: any) => {
      const isForCurrentUser =
        item.targetUserId === session.user._id ||
        item.targetRole === session.user.role ||
        (!item.targetUserId && !item.targetRole);

      if (isForCurrentUser) {
        setNotificationCount((prev) => prev + 1);
      }
    });

    socket.on("chat:message", (data: any) => {
      if (data?.sender === "ADMIN") {
        setChatUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [session]);

  const onSearch = (value: string) => {
    const path = value ? `/?search=${encodeURIComponent(value)}` : "/";

    router.push(path);
  };

  const menuItems = (
    <>
      <Link href="/">
        <Button
          type="text"
          icon={<HomeOutlined />}
          style={{
            width: screens.md ? "auto" : "100%",
          }}
        >
          Trang chủ
        </Button>
      </Link>

      {/* CART */}
      <Link href="/cart" onClick={() => setCartCount(0)}>
        <Badge count={cartCount} size="small" offset={[6, -4]}>
          <Button
            type="text"
            icon={<ShoppingCartOutlined />}
            style={{
              width: screens.md ? "auto" : "100%",
            }}
          >
            Giỏ hàng
          </Button>
        </Badge>
      </Link>

      <Link href="/orders">
        <Button
          type="text"
          icon={<AppstoreOutlined />}
          style={{
            width: screens.md ? "auto" : "100%",
          }}
        >
          Đơn hàng
        </Button>
      </Link>

      <Link href="/my-discounts">
        <Button
          type="text"
          icon={<GiftOutlined />}
          style={{
            width: screens.md ? "auto" : "100%",
          }}
        >
          Voucher
        </Button>
      </Link>

      <Link href="/notifications">
        <Badge count={notificationCount} size="small" offset={[6, -4]}>
          <Button
            type="text"
            icon={<BellOutlined />}
            style={{
              width: screens.md ? "auto" : "100%",
            }}
          >
            Thông báo
          </Button>
        </Badge>
      </Link>

      {session?.user && (
        <Link href="/profile">
          <Button
            type="text"
            icon={<UserOutlined />}
            style={{
              width: screens.md ? "auto" : "100%",
            }}
          >
            Hồ sơ
          </Button>
        </Link>
      )}

      <Link href="/ai">
        <Button
          type="text"
          icon={<RobotOutlined />}
          style={{
            width: screens.md ? "auto" : "100%",
          }}
        >
          AI
        </Button>
      </Link>

      {session?.user && (
        <Link href="/chat" onClick={() => setChatUnreadCount(0)}>
          <Badge
            count={chatUnreadCount}
            size="small"
            offset={[6, -4]}
            style={{ backgroundColor: "#ff4d4f" }}
          >
            <Button
              type="text"
              icon={<MenuOutlined />}
              style={{
                width: screens.md ? "auto" : "100%",
              }}
            >
              Chat
            </Button>
          </Badge>
        </Link>
      )}

      {session?.user?.role === "ADMIN" && (
        <Link href="/dashboard">
          <Button
            type="primary"
            icon={<AppstoreOutlined />}
            style={{
              width: screens.md ? "auto" : "100%",
            }}
          >
            Admin
          </Button>
        </Link>
      )}

      {session?.user ? (
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            width: screens.md ? "auto" : "100%",
          }}
        >
          Thoát
        </Button>
      ) : (
        <Link href="/auth/login">
          <Button
            type="primary"
            icon={<UserOutlined />}
            style={{
              width: screens.md ? "auto" : "100%",
            }}
          >
            Đăng nhập
          </Button>
        </Link>
      )}
    </>
  );

  return (
    <>
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 1000,
          width: "100%",
          background: "#ffffff",
          borderBottom: "1px solid #f0f0f0",
          padding: 0,
          height: "auto",
          lineHeight: "normal",
          boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: "0 auto",
            minHeight: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            padding: "12px",
          }}
        >
          <div
            style={{
              minWidth: 160,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Link
              href="/"
              style={{
                color: "#1677ff",
                fontSize: screens.md ? 28 : 22,
                fontWeight: 800,
                letterSpacing: 1,
              }}
            >
              AVENZA
            </Link>

            {session?.user?.name ? (
              <Text
                type="secondary"
                style={{
                  marginTop: 2,
                  fontSize: 13,
                }}
              >
                Xin chào, {session.user.name}
              </Text>
            ) : null}
          </div>

          <div
            style={{
              flex: 1,
              width: screens.md ? "auto" : "100%",
              order: screens.md ? 0 : 3,
            }}
          >
            <Input.Search
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onSearch={onSearch}
              placeholder="Tìm sản phẩm, danh mục..."
              enterButton
              size="large"
              allowClear
            />
          </div>

          {screens.md ? (
            <Space size={4} wrap>
              {menuItems}
            </Space>
          ) : (
            <Button
              type="text"
              icon={<MenuOutlined />}
              size="large"
              onClick={() => setOpenDrawer(true)}
            />
          )}
        </div>
      </Header>

      <Drawer
        title="Menu"
        placement="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      >
        <Space
          direction="vertical"
          style={{
            width: "100%",
            alignItems: "flex-start",
          }}
        >
          {menuItems}
        </Space>
      </Drawer>
    </>
  );
};

export default GuestHeader;
