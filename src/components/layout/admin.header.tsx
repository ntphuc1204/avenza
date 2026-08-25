"use client";
import { AdminContext } from "@/library/admin.context";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { Button, Layout } from "antd";
import { useContext } from "react";
import { DownOutlined } from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Dropdown, Space, Popover } from "antd";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const AdminHeader = (props: any) => {
  const router = useRouter();
  // const { data: session, status } = useSession();
  const { session } = props;

  const { Header } = Layout;
  const { collapseMenu, setCollapseMenu } = useContext(AdminContext)!;

  const [stockStats, setStockStats] = useState<any | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const res = await fetch(`${base}/api/v1/stock-imports/stats`, {
          method: "GET",
        });
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          setStockStats(json?.data || json || null);
        }
      } catch (err) {
        // ignore
      }
    };

    load();
  }, []);

  const items: MenuProps["items"] = [
    {
      key: "1",
      label: <span>Settings</span>,
    },

    {
      key: "4",
      danger: true,
      label: (
        <span onClick={() => signOut({ callbackUrl: "/auth/login" })}>
          Đăng xuất
        </span>
      ),
    },
  ];

  return (
    <>
      <Header
        style={{
          padding: 0,
          display: "flex",
          background: "#f5f5f5",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingLeft: 20,
          }}
        >
          <Button
            type="default"
            icon={<HomeOutlined />}
            onClick={() => router.push("/")}
          >
            Trang chủ
          </Button>

          <Popover
            placement="bottomLeft"
            title="Thống kê nhập hàng"
            content={
              stockStats ? (
                <div style={{ minWidth: 220 }}>
                  <div>
                    <b>Tổng phiếu:</b> {stockStats.totalCount}
                  </div>
                  <div>
                    <b>Tổng SL:</b> {stockStats.totalQuantity}
                  </div>
                  <div>
                    <b>Tổng giá trị:</b>{" "}
                    {Number(stockStats.totalValue || 0).toLocaleString("vi-VN")}
                    ₫
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <b>Mới nhất:</b>
                    <ul style={{ paddingLeft: 16, marginTop: 6 }}>
                      {(stockStats.recent || []).map((r: any) => (
                        <li key={r._id} style={{ fontSize: 12 }}>
                          {r.productId?.name || r.productId} — {r.quantity} —{" "}
                          {Number(r.importPrice || 0).toLocaleString("vi-VN")}₫
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div>Không có dữ liệu</div>
              )
            }
          ></Popover>
        </div>

        <Dropdown menu={{ items }}>
          <a
            onClick={(e) => e.preventDefault()}
            style={{
              color: "unset",
              lineHeight: "0 !important",
              marginRight: 20,
            }}
          >
            <Space>
              {session?.user?.email ?? ""}
              <DownOutlined />
            </Space>
          </a>
        </Dropdown>
      </Header>
    </>
  );
};

export default AdminHeader;
