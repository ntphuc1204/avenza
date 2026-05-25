"use client";

import Layout from "antd/es/layout";
import Menu from "antd/es/menu";
import Badge from "antd/es/badge";

import {
  AppstoreOutlined,
  BellOutlined,
  TeamOutlined,
  ShopOutlined,
  ProfileOutlined,
  CommentOutlined,
  RobotOutlined,
  TruckOutlined,
  ImportOutlined,
  GiftOutlined,
  PictureOutlined,
} from "@ant-design/icons";

import React, { useContext, useEffect, useRef, useState } from "react";

import { AdminContext } from "@/library/admin.context";

import type { MenuProps } from "antd";

import Link from "next/link";

import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";
import { sendRequest } from "@/utils/api";

type MenuItem = Required<MenuProps>["items"][number];

const AdminSideBar = () => {
  const { Sider } = Layout;

  const { collapseMenu } = useContext(AdminContext)!;

  const { data: session } = useSession();

  const [notificationCount, setNotificationCount] = useState(0);
  const [chatUnreadCount, setChatUnreadCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const loadUnreadCount = async () => {
      if (!session?.user?.access_token) return;

      const res = await sendRequest<IBackendRes<{ count: number }>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/notifications/unread-count`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.user.access_token}`,
        },
      });

      setNotificationCount(res?.data?.count ?? 0);
    };

    loadUnreadCount();

    window.addEventListener("notificationsRead", loadUnreadCount);
    window.addEventListener("chatViewed", () => setChatUnreadCount(0));

    return () => {
      window.removeEventListener("notificationsRead", loadUnreadCount);
      window.removeEventListener("chatViewed", () => setChatUnreadCount(0));
    };
  }, [session]);

  useEffect(() => {
    if (!session?.user?.access_token) return;

    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081",
      {
        transports: ["websocket"],
        query: { userId: session.user._id, role: "ADMIN" },
      },
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    // realtime đơn hàng mới
    socket.on("notification-created", (item: any) => {
      if (item.targetRole === "ADMIN" || !item.targetRole) {
        setNotificationCount((prev) => prev + 1);
      }
    });

    // realtime tin nhắn mới từ users
    socket.on("chat:message", (data: any) => {
      // khi có tin nhắn từ user, tăng badge count
      if (data?.sender === "USER") {
        setChatUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [session]);

  const items: MenuItem[] = [
    {
      key: "grp",
      label: "Avenza",

      type: "group",

      children: [
        {
          key: "dashboard",

          label: <Link href="/dashboard">Dashboard</Link>,

          icon: <AppstoreOutlined />,
        },

        {
          key: "users",

          label: <Link href="/dashboard/user">Manage Users</Link>,

          icon: <TeamOutlined />,
        },

        {
          key: "product",

          label: <Link href="/dashboard/product">Manage Products</Link>,

          icon: <ShopOutlined />,
        },

        {
          key: "categories",

          label: <Link href="/dashboard/categories">Manage Categories</Link>,

          icon: <ProfileOutlined />,
        },

        {
          key: "suppliers",

          label: <Link href="/dashboard/suppliers">Manage Suppliers</Link>,

          icon: <TruckOutlined />,
        },

        {
          key: "stock-imports",

          label: <Link href="/dashboard/stock-imports">Nhập hàng</Link>,

          icon: <ImportOutlined />,
        },

        {
          key: "orders",

          label: <Link href="/dashboard/orders">Manage Orders</Link>,

          icon: <ShopOutlined />,
        },
        {
          key: "reviews",

          label: <Link href="/dashboard/reviews">Manage Reviews</Link>,

          icon: <CommentOutlined />,
        },
        {
          key: "discounts",

          label: <Link href="/dashboard/discounts">Manage Vouchers</Link>,

          icon: <GiftOutlined />,
        },
        {
          key: "banners",

          label: <Link href="/dashboard/banners">Manage Banners</Link>,

          icon: <PictureOutlined />,
        },
        {
          key: "chat",

          label: (
            <Link href="/dashboard/chat">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>Chat Support</span>
                {chatUnreadCount > 0 && (
                  <Badge
                    count={chatUnreadCount}
                    size="small"
                    style={{ backgroundColor: "#ff4d4f" }}
                  />
                )}
              </div>
            </Link>
          ),

          icon: <CommentOutlined />,
        },
        {
          key: "notifications",

          label: (
            <Link href="/dashboard/notifications">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>Notifications</span>

                {notificationCount > 0 && (
                  <Badge count={notificationCount} size="small" />
                )}
              </div>
            </Link>
          ),

          icon: <BellOutlined />,
        },

        {
          key: "ai",

          label: <Link href="/dashboard/ai">AI Console</Link>,

          icon: <RobotOutlined />,
        },
      ],
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapseMenu}
      collapsedWidth={80}
      width="auto"
      breakpoint="lg"
      style={{
        minHeight: "100vh",

        position: "sticky",

        left: 0,

        top: 0,

        overflow: "auto",

        minWidth:
          typeof window !== "undefined" && window.innerWidth > 1000 ? 300 : 80,
      }}
    >
      <Menu
        mode="inline"
        defaultSelectedKeys={["dashboard"]}
        items={items}
        style={{
          height: "100vh",
        }}
      />
    </Sider>
  );
};

export default AdminSideBar;
