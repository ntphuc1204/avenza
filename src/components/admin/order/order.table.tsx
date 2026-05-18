"use client";

import { message, Pagination, Select, Tag, Button } from "antd";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { sendRequest } from "@/utils/api";

interface IOrderProduct {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}

interface IShippingAddress {
  recipientName?: string;
  phone?: string;
  address?: string;
  note?: string;
}

interface IOrder {
  _id: string;

  userId?: any;

  products: IOrderProduct[];

  totalPrice: number;

  shippingAddress?: IShippingAddress;

  paymentMethod?: string;

  orderStatus?: string;

  paymentStatus?: string;

  createdAt?: string;
}

interface IMeta {
  current: number;
  pageSize: number;
  pages: number;
  total: number;
}

interface IProps {
  data: {
    meta: IMeta;
    results: IOrder[];
  };

  accessToken?: string;
}

const STATUS_OPTIONS = [
  "PENDING",
  "PROCESSING",
  "DELIVERING",
  "DELIVERED",
  "CANCELLED",
];

const OrderTable = ({ data, accessToken }: IProps) => {
  const orders = data?.results || [];

  const meta = data?.meta || {
    current: 1,
    pageSize: 20,
    pages: 0,
    total: 0,
  };

  const router = useRouter();

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");

      return;
    }

    setUpdatingId(orderId);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/${orderId}/status`,

        method: "PUT",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },

        body: {
          _id: orderId,
          status,
        },
      });

      if (res?.data) {
        message.success("Cập nhật trạng thái thành công");

        router.refresh();
      } else {
        message.error(res?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      {/* HEADER */}

      <div className="page-header">
        <h2 className="page-title">Quản lý đơn hàng</h2>
      </div>

      {/* TABLE */}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã đơn</th>

              <th>Khách hàng</th>

              <th>Tổng tiền</th>

              <th>Trạng thái đơn</th>

              <th>Thanh toán</th>

              <th>Phương thức</th>

              <th>Địa chỉ giao hàng</th>

              <th>Sản phẩm</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((item) => {
              const isExpanded = expandedRows.includes(item._id);

              return (
                <>
                  <tr key={item._id}>
                    {/* MÃ ĐƠN */}

                    <td>
                      <div className="table-subtext">{item._id}</div>
                    </td>

                    {/* KHÁCH HÀNG */}

                    <td>
                      {typeof item.userId === "string"
                        ? item.userId
                        : item.userId?.email || item.userId?._id || "-"}
                    </td>

                    {/* TỔNG TIỀN */}

                    <td>
                      <strong>
                        {item.totalPrice?.toLocaleString("vi-VN")} đ
                      </strong>
                    </td>

                    {/* TRẠNG THÁI ĐƠN */}

                    <td>
                      <Tag
                        color={
                          item.orderStatus === "DELIVERED"
                            ? "green"
                            : item.orderStatus === "CANCELLED"
                              ? "red"
                              : "orange"
                        }
                      >
                        {item.orderStatus}
                      </Tag>
                    </td>

                    {/* THANH TOÁN */}

                    <td>
                      <Tag
                        color={
                          item.paymentStatus === "SUCCESS"
                            ? "green"
                            : item.paymentStatus === "FAILED"
                              ? "red"
                              : "orange"
                        }
                      >
                        {item.paymentStatus}
                      </Tag>
                    </td>

                    {/* PAYMENT */}

                    <td>{item.paymentMethod || "-"}</td>

                    {/* SHIPPING ADDRESS */}

                    <td>
                      <div className="table-subtext">
                        {item.shippingAddress ? (
                          <>
                            <div>
                              <strong>
                                {item.shippingAddress.recipientName}
                              </strong>
                            </div>

                            <div>{item.shippingAddress.phone}</div>

                            <div>{item.shippingAddress.address}</div>

                            {item.shippingAddress.note && (
                              <div>Ghi chú: {item.shippingAddress.note}</div>
                            )}
                          </>
                        ) : (
                          "-"
                        )}
                      </div>
                    </td>

                    {/* PRODUCTS */}

                    <td>
                      <Button
                        size="small"
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedRows(
                              expandedRows.filter((id) => id !== item._id),
                            );
                          } else {
                            setExpandedRows([...expandedRows, item._id]);
                          }
                        }}
                      >
                        {isExpanded ? "Ẩn" : "Xem"}
                      </Button>
                    </td>

                    {/* ACTION */}

                    <td className="sticky-column">
                      <div className="action-group">
                        <Select
                          value={item.orderStatus}
                          loading={updatingId === item._id}
                          style={{ width: 180 }}
                          onChange={(status) =>
                            handleUpdateStatus(item._id, status)
                          }
                          options={STATUS_OPTIONS.map((status) => ({
                            value: status,
                            label: status,
                          }))}
                        />
                      </div>
                    </td>
                  </tr>

                  {/* EXPANDED PRODUCTS */}

                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="expanded-row">
                        <div className="expanded-content">
                          <h4>Danh sách sản phẩm</h4>

                          <div className="order-products">
                            {item.products?.map((product, index) => (
                              <div
                                key={`${product.productId}-${index}`}
                                className="order-product-item"
                              >
                                <div>
                                  <strong>
                                    {product.name || product.productId}
                                  </strong>
                                </div>

                                <div>Số lượng: {product.quantity}</div>

                                <div>
                                  Giá: {product.price?.toLocaleString("vi-VN")}{" "}
                                  đ
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}

      <div className="pagination-wrapper">
        <Pagination
          current={meta.current}
          pageSize={meta.pageSize}
          total={meta.total}
          showSizeChanger
          showQuickJumper
          pageSizeOptions={["10", "20", "50", "100"]}
        />
      </div>
    </div>
  );
};

export default OrderTable;
