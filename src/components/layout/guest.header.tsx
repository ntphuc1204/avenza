"use client";

import {
  AppstoreOutlined,
  HomeOutlined,
  RobotOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Button, Drawer, Input, Layout, Space, Typography, Grid } from "antd";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const { Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const GuestHeader = () => {
  const { data: session } = useSession();

  const router = useRouter();

  const searchParams = useSearchParams();

  const screens = useBreakpoint();

  const [search, setSearch] = useState("");

  const [openDrawer, setOpenDrawer] = useState(false);

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

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
          style={{ width: screens.md ? "auto" : "100%" }}
        >
          Trang chủ
        </Button>
      </Link>

      <Link href="/cart">
        <Button
          type="text"
          icon={<ShoppingCartOutlined />}
          style={{ width: screens.md ? "auto" : "100%" }}
        >
          Giỏ hàng
        </Button>
      </Link>

      <Link href="/orders">
        <Button
          type="text"
          icon={<AppstoreOutlined />}
          style={{ width: screens.md ? "auto" : "100%" }}
        >
          Đơn hàng
        </Button>
      </Link>

      <Link href="/ai">
        <Button
          type="text"
          icon={<RobotOutlined />}
          style={{ width: screens.md ? "auto" : "100%" }}
        >
          AI
        </Button>
      </Link>

      {session?.user ? (
        <Button
          type="primary"
          danger
          icon={<LogoutOutlined />}
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{ width: screens.md ? "auto" : "100%" }}
        >
          Thoát
        </Button>
      ) : (
        <Link href="/auth/login">
          <Button
            type="primary"
            icon={<UserOutlined />}
            style={{ width: screens.md ? "auto" : "100%" }}
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
          }}
        >
          {menuItems}
        </Space>
      </Drawer>
    </>
  );
};

export default GuestHeader;
