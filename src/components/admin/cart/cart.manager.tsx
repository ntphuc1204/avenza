"use client";

import { Button, InputNumber, message, Popconfirm, Typography } from "antd";

import { DeleteTwoTone } from "@ant-design/icons";

import { useState } from "react";

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

  const renderImage = (image?: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    return image
      ? image.startsWith("http")
        ? image
        : `${baseUrl}${image}`
      : "/images/no-image.png";
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");

      return;
    }

    setLoadingItem(productId);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/update`,

        method: "PUT",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },

        body: {
          productId,
          quantity,
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
  };

  const removeItem = async (productId: string) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");

      return;
    }

    setLoadingItem(productId);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/cart/remove/${productId}`,

        method: "DELETE",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data) {
        setCart(res.data);

        message.success("Xóa sản phẩm thành công");
      } else {
        message.error(res?.message || "Xóa thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi xóa sản phẩm");
    } finally {
      setLoadingItem(null);
    }
  };

  const clearCart = async () => {
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
  };

  return (
    <div className="page-wrapper">
      {/* HEADER */}

      <div className="page-header">
        <div>
          <h2 className="page-title">Quản lý Cart</h2>

          <p className="page-description">
            Giỏ hàng hiện tại của admin/user đang đăng nhập
          </p>
        </div>

        <div className="page-actions">
          <Button danger loading={clearing} onClick={clearCart}>
            Clear Cart
          </Button>
        </div>
      </div>

      {/* TABLE */}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>

              <th>Ảnh</th>

              <th>Sản phẩm</th>

              <th>Giá</th>

              <th>Số lượng</th>

              <th>Thành tiền</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {cart.items?.map((item, index) => (
              <tr key={item.productId}>
                <td>{index + 1}</td>

                <td>
                  <img
                    src={renderImage(item.image)}
                    alt={item.name}
                    className="table-image"
                  />
                </td>

                <td>
                  <div className="table-name">
                    {item.name || item.productId}
                  </div>

                  <div className="table-subtext">ID: {item.productId}</div>
                </td>

                <td>{item.price?.toLocaleString("vi-VN")} đ</td>

                <td>
                  <InputNumber
                    min={0}
                    value={item.quantity}
                    onChange={(value) =>
                      updateQuantity(item.productId, Number(value ?? 0))
                    }
                  />
                </td>

                <td>
                  {(item.price * item.quantity)?.toLocaleString("vi-VN")} đ
                </td>

                <td className="sticky-column">
                  <div className="action-group">
                    <Popconfirm
                      title="Xóa sản phẩm khỏi giỏ hàng?"
                      onConfirm={() => removeItem(item.productId)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <DeleteTwoTone
                        twoToneColor="#ff4d4f"
                        className="action-icon"
                      />
                    </Popconfirm>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTAL */}

      <div className="cart-total-wrapper">
        <Typography.Title level={4}>
          Tổng: {cart.totalPrice?.toLocaleString("vi-VN")} đ
        </Typography.Title>
      </div>
    </div>
  );
};

export default CartManager;
