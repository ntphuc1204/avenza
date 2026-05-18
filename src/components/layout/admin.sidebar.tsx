"use client";
import Layout from "antd/es/layout";
import Menu from "antd/es/menu";
import {
  AppstoreOutlined,
  TeamOutlined,
  ShopOutlined,
  ProfileOutlined,
  CreditCardOutlined,
  CommentOutlined,
  ShoppingCartOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import React, { useContext } from "react";
import { AdminContext } from "@/library/admin.context";
import type { MenuProps } from "antd";
import Link from "next/link";

type MenuItem = Required<MenuProps>["items"][number];
const AdminSideBar = () => {
  const { Sider } = Layout;
  const { collapseMenu } = useContext(AdminContext)!;

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
          key: "orders",
          label: <Link href="/dashboard/orders">Manage Orders</Link>,
          icon: <ShopOutlined />,
        },
        {
          key: "payments",
          label: <Link href="/dashboard/payments">Manage Payments</Link>,
          icon: <CreditCardOutlined />,
        },
        {
          key: "reviews",
          label: <Link href="/dashboard/reviews">Manage Reviews</Link>,
          icon: <CommentOutlined />,
        },
        {
          key: "cart",
          label: <Link href="/dashboard/cart">Manage Cart</Link>,
          icon: <ShoppingCartOutlined />,
        },
        {
          key: "notifications",
          label: <Link href="/dashboard/notifications">Notifications</Link>,
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
        style={{ height: "100vh" }}
      />
    </Sider>
  );
};

export default AdminSideBar;
