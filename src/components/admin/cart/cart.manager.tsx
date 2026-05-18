"use client";

import { Button, InputNumber, message, Space, Table, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendRequest } from "@/utils/api";

interface ICartItem {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}

interface ICart {
  items: ICartItem[];
  totalPrice: number;
}

interface IProps {
  data: ICart;
  accessToken?: string;
}

const CartManager = ({ data, accessToken }: IProps) => {
  const [cart, setCart] = useState<ICart>(data);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const router = useRouter();

  const columns: ColumnsType<ICartItem> = useMemo(
    () => [
      {
        title: "#",
        width: 60,
        render: (_: any, __: ICartItem, index: number) => index + 1,
      },
      {
        title: "Sản phẩm",
        dataIndex: "name",
        width: 260,
      },
      {
        title: "Giá",
        dataIndex: "price",
        width: 160,
        render: (price: number) => `${price?.toLocaleString("vi-VN")} đ`,
      },
      {
        title: "Số lượng",
        dataIndex: "quantity",
        width: 180,
        render: (quantity: number, record: ICartItem) => (
          <InputNumber
            min={0}
            value={quantity}
            onChange={async (value) => {
              if (!accessToken) {
                message.error("Không tìm thấy quyền truy cập");
                return;
              }
              const nextQuantity = Number(value ?? 0);
              setLoadingItem(record.productId);
              try {
                const res = await sendRequest<IBackendRes<any>>({
                  url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/update`,
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                  body: {
                    productId: record.productId,
                    quantity: nextQuantity,
                  },
                });
                if (res?.data) {
                  setCart(res.data);
                  message.success("Cập nhật giỏ hàng thành công");
                } else {
                  message.error(res?.message || "Cập nhật thất bại");
                }
              } catch (error) {
                message.error("Lỗi khi cập nhật giỏ hàng");
              } finally {
                setLoadingItem(null);
              }
            }}
          />
        ),
      },
      {
        title: "Thành tiền",
        width: 180,
        render: (_: any, record: ICartItem) => `${(record.price * record.quantity)?.toLocaleString("vi-VN")} đ`,
      },
      {
        title: "Hành động",
        width: 140,
        render: (_: any, record: ICartItem) => (
          <Button
            danger
            onClick={async () => {
              if (!accessToken) {
                message.error("Không tìm thấy quyền truy cập");
                return;
              }
              setLoadingItem(record.productId);
              try {
                const res = await sendRequest<IBackendRes<any>>({
                  url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/remove/${record.productId}`,
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                });
                if (res?.data) {
                  setCart(res.data);
                  message.success("Xóa sản phẩm khỏi giỏ hàng thành công");
                } else {
                  message.error(res?.message || "Xóa thất bại");
                }
              } catch (error) {
                message.error("Lỗi khi xóa sản phẩm");
              } finally {
                setLoadingItem(null);
              }
            }}
            loading={loadingItem === record.productId}
          >
            Xóa
          </Button>
        ),
      },
    ],
    [accessToken],
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20}}>
        <div>
          <Typography.Title level={3}>Quản lý Cart</Typography.Title>
          <Typography.Text>Giỏ hàng hiện tại của admin/user đang đăng nhập</Typography.Text>
        </div>
        <Button
          danger
          loading={clearing}
          onClick={async () => {
            if (!accessToken) {
              message.error("Không tìm thấy quyền truy cập");
              return;
            }
            setClearing(true);
            try {
              const res = await sendRequest<IBackendRes<any>>({
                url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/clear`,
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              });
              if (res?.data) {
                setCart(res.data);
                message.success("Đã xóa toàn bộ giỏ hàng");
              } else {
                message.error(res?.message || "Xóa thất bại");
              }
            } catch (error) {
              message.error("Lỗi khi xóa giỏ hàng");
            } finally {
              setClearing(false);
            }
          }}
        >
          Clear Cart
        </Button>
      </div>
      <Table
        rowKey={(record) => record.productId}
        dataSource={cart.items}
        columns={columns}
        bordered
        pagination={false}
      />
      <div style={{ marginTop: 18, textAlign: "right" }}>
        <Typography.Title level={4}>Tổng: {cart.totalPrice?.toLocaleString("vi-VN")} đ</Typography.Title>
      </div>
    </div>
  );
};

export default CartManager;
