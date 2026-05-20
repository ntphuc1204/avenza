"use client";

import Layout from "antd/es/layout";
import Menu from "antd/es/menu";
import Badge from "antd/es/badge";

import {
  AppstoreOutlined,
  TeamOutlined,
  ShopOutlined,
  ProfileOutlined,
  CreditCardOutlined,
  CommentOutlined,
  ShoppingCartOutlined,
  RobotOutlined,
  TruckOutlined,
  ImportOutlined,
} from "@ant-design/icons";

import React, { useContext, useEffect, useRef, useState } from "react";

import { AdminContext } from "@/library/admin.context";

import type { MenuProps } from "antd";

import Link from "next/link";

import { io, Socket } from "socket.io-client";

type MenuItem = Required<MenuProps>["items"][number];

const AdminSideBar = () => {
  const { Sider } = Layout;

  const { collapseMenu } = useContext(AdminContext)!;

  const [notificationCount, setNotificationCount] = useState(0);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8081",
      {
        transports: ["websocket"],
      },
    );

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
    });

    // realtime đơn hàng mới
    socket.on("new-order", () => {
      setNotificationCount((prev) => prev + 1);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

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

          label: <Link href="/dashboard/suppliers">Nhà cung cấp</Link>,

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

          icon: <ProfileOutlined />,
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
