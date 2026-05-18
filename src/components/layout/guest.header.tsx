"use client";

import {
  AppstoreOutlined,
  HomeOutlined,
  RobotOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { Button, Input, Layout, Space } from "antd";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const { Header } = Layout;

const GuestHeader = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(searchParams?.get("search") ?? "");
  }, [searchParams]);

  const onSearch = (value: string) => {
    const path = value ? `/?search=${encodeURIComponent(value)}` : "/";
    router.push(path);
  };

  return (
    <Header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 1000,
        width: "100%",
        background: "#ffffff",
        borderBottom: "1px solid #f0f0f0",
        padding: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div style={{ minWidth: 180 }}>
          <Link
            href="/"
            style={{ color: "#111", fontSize: 24, fontWeight: 700 }}
          >
            AVENZA
          </Link>
        </div>

        <div style={{ flex: 1, minWidth: 240, maxWidth: 520 }}>
          <Input.Search
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSearch={onSearch}
            placeholder="Tìm sản phẩm, danh mục, mã..."
            enterButton
          />
        </div>

        <Space wrap>
          <Link href="/">
            <Button type="text" icon={<HomeOutlined />}>
              Trang chủ
            </Button>
          </Link>
          <Link href="/cart">
            <Button type="text" icon={<ShoppingCartOutlined />}>
              Giỏ hàng
            </Button>
          </Link>
          <Link href="/orders">
            <Button type="text" icon={<AppstoreOutlined />}>
              Đơn hàng
            </Button>
          </Link>
          <Link href="/ai">
            <Button type="text" icon={<RobotOutlined />}>
              AI
            </Button>
          </Link>
          {session?.user ? (
            <Button
              type="primary"
              icon={<LogoutOutlined />}
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Thoát
            </Button>
          ) : (
            <Link href="/auth/login">
              <Button type="primary" icon={<UserOutlined />}>
                Đăng nhập
              </Button>
            </Link>
          )}
        </Space>
      </div>
    </Header>
  );
};

export default GuestHeader;
