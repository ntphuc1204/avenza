"use client";

import {
  message,
  Pagination,
  Select,
  Tag,
  Button,
  Modal,
  Space,
  Popconfirm,
  Input,
} from "antd";

import React, { useState, Fragment } from "react";

import { useRouter } from "next/navigation";

import { sendRequest } from "@/utils/api";
import orderDetailsApi from "@/utils/orderDetails.api";
import OrderDetailEditModal from "./orderDetail.edit";

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

  userId?: any | { name: string; email: string; phone: string };

  products: IOrderProduct[];

  totalPrice: number;

  shippingAddress?: IShippingAddress;

  paymentMethod?: string;

  orderStatus?: string;

  paymentStatus?: string;

  createdAt?: string;

  cancelStatus?: string;

  cancelReason?: string;

  cancelMessage?: string;

  cancelRequestedAt?: string;
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
  "DELIVERY_FAILED",
  "CANCELLED",
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ xử lý", color: "orange" },
  PROCESSING: { label: "Đang xử lý", color: "blue" },
  DELIVERING: { label: "Đang giao", color: "cyan" },
  DELIVERED: { label: "Đã giao", color: "green" },
  DELIVERY_FAILED: { label: "Giao hàng thất bại", color: "volcano" },
  CANCELLED: { label: "Hủy", color: "red" },
};

const PAYMENT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ thanh toán", color: "orange" },
  SUCCESS: { label: "Đã thanh toán", color: "green" },
  FAILED: { label: "Thanh toán thất bại", color: "red" },
  REFUND_PENDING: { label: "Đang hoàn tiền", color: "orange" },
  REFUNDED: { label: "Đã hoàn tiền", color: "cyan" },
};

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

  const [searchQuery, setSearchQuery] = useState<string>("");

  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(
    null,
  );
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelMessage, setCancelMessage] = useState<string>("");
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);

  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [orderDetailsMap, setOrderDetailsMap] = useState<Record<string, any[]>>(
    {},
  );
  const [editingDetail, setEditingDetail] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    try {
      const params = new URLSearchParams(window.location.search);
      params.set("current", "1");
      params.set("pageSize", "20");
      if (value) {
        params.set("query", value);
      } else {
        params.delete("query");
      }
      router.push(`${window.location.pathname}?${params.toString()}`);
    } catch (e) {
      // fallback
    }
  };

  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (status === "CANCELLED") {
      setCancelModalOrderId(orderId);
      setCancelReason("");
      setCancelMessage("");
      setIsCancelModalVisible(true);
      return;
    }

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

  const handleApproveCancel = async (orderId: string) => {
    Modal.confirm({
      title: "Xác nhận hủy đơn",
      content: "Bạn có chắc muốn xác nhận hủy đơn hàng này?",

      okText: "Xác nhận",
      cancelText: "Đóng",

      onOk: async () => {
        if (!accessToken) {
          message.error("Không tìm thấy quyền truy cập");

          return;
        }

        setUpdatingId(orderId);

        try {
          const res = await sendRequest<IBackendRes<any>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/${orderId}/approve-cancel`,

            method: "PUT",

            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (res?.data) {
            message.success("Đã xác nhận hủy đơn hàng");

            router.refresh();
          } else {
            message.error(res?.message || "Không thể xác nhận hủy");
          }
        } catch (error) {
          message.error("Lỗi khi xác nhận hủy");
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const handleMarkRefunded = async (orderId: string) => {
    Modal.confirm({
      title: "Xác nhận hoàn tiền",
      content: "Bạn có chắc đơn hàng này đã hoàn tiền thành công?",

      okText: "Xác nhận",
      cancelText: "Đóng",

      onOk: async () => {
        if (!accessToken) {
          message.error("Không tìm thấy quyền truy cập");

          return;
        }

        setUpdatingId(orderId);

        try {
          const res = await sendRequest<IBackendRes<any>>({
            url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/${orderId}/refunded`,
            method: "PUT",
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          if (res?.data) {
            message.success("Đã đánh dấu hoàn tiền");
            router.refresh();
          } else {
            message.error(res?.message || "Không thể hoàn tiền");
          }
        } catch (error) {
          message.error("Lỗi khi xác nhận hoàn tiền");
        } finally {
          setUpdatingId(null);
        }
      },
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason || !cancelModalOrderId) {
      message.error("Vui lòng nhập lý do hủy đơn");
      return;
    }

    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");
      return;
    }

    setUpdatingId(cancelModalOrderId);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/${cancelModalOrderId}/status`,
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          status: "CANCELLED",
          cancelReason,
          cancelMessage,
        },
      });

      if (res?.data) {
        message.success("Cập nhật hủy đơn thành công");
        router.refresh();
        setIsCancelModalVisible(false);
      } else {
        message.error(res?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật trạng thái");
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePaginationChange = (page: number, pageSize?: number) => {
    const params = new URLSearchParams(window.location.search);

    params.set("current", String(page));

    if (pageSize) {
      params.set("pageSize", String(pageSize));
    }

    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">Quản lý đơn hàng</h2>
        <Input.Search
          placeholder="Tìm kiếm mã đơn (VD: 12345678)"
          allowClear
          style={{ width: 250 }}
          onSearch={handleSearch}
        />
      </div>

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

              <th>Yêu cầu hủy</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((item) => {
              const isExpanded = expandedRows.includes(item._id);

              return (
                <Fragment key={item._id}>
                  <tr
                    onClick={() => {
                      if (isExpanded) {
                        setExpandedRows(
                          expandedRows.filter((id) => id !== item._id),
                        );
                      } else {
                        setExpandedRows([...expandedRows, item._id]);
                      }
                    }}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <div className="table-subtext">
                        {item._id?.slice(-8) || item._id}
                      </div>
                    </td>

                    <td>
                      {typeof item.userId === "string"
                        ? item.userId
                        : item.userId?.name ||
                          item.userId?.email ||
                          item.userId?._id ||
                          "-"}
                    </td>

                    <td>
                      <strong>
                        {item.totalPrice?.toLocaleString("vi-VN")} đ
                      </strong>
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 8,
                        }}
                      >
                        <Tag
                          color={
                            STATUS_MAP[
                              item.orderStatus as keyof typeof STATUS_MAP
                            ]?.color || "orange"
                          }
                        >
                          {STATUS_MAP[
                            item.orderStatus as keyof typeof STATUS_MAP
                          ]?.label || item.orderStatus}
                        </Tag>

                        {item.cancelStatus === "REQUESTED" && (
                          <Tag color="volcano">Yêu cầu hủy</Tag>
                        )}

                        {item.cancelStatus === "APPROVED" && (
                          <Tag color="red">Đã duyệt hủy</Tag>
                        )}
                      </div>
                    </td>

                    <td>
                      <Tag
                        color={
                          PAYMENT_STATUS_MAP[
                            item.paymentStatus as keyof typeof PAYMENT_STATUS_MAP
                          ]?.color || "orange"
                        }
                      >
                        {PAYMENT_STATUS_MAP[
                          item.paymentStatus as keyof typeof PAYMENT_STATUS_MAP
                        ]?.label || item.paymentStatus}
                      </Tag>
                    </td>

                    <td>{item.paymentMethod || "-"}</td>

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

                    <td>
                      {item.cancelStatus === "REQUESTED" ? (
                        <div
                          style={{
                            minWidth: 220,
                          }}
                        >
                          <div>
                            <strong>Lý do:</strong>
                          </div>

                          <div>{item.cancelReason}</div>

                          <div
                            style={{
                              marginTop: 8,
                            }}
                          >
                            <strong>Nội dung:</strong>
                          </div>

                          <div>{item.cancelMessage}</div>

                          <Button
                            danger
                            type="primary"
                            loading={updatingId === item._id}
                            style={{
                              marginTop: 12,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveCancel(item._id);
                            }}
                          >
                            Xác nhận hủy
                          </Button>
                        </div>
                      ) : item.paymentStatus === "REFUND_PENDING" ? (
                        <div style={{ minWidth: 220 }}>
                          <Tag color="orange">Chờ hoàn tiền</Tag>

                          <Button
                            type="primary"
                            loading={updatingId === item._id}
                            style={{
                              marginTop: 12,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkRefunded(item._id);
                            }}
                          >
                            Hoàn tiền xong
                          </Button>
                        </div>
                      ) : item.cancelStatus === "APPROVED" ? (
                        <Tag color="red">Đã hủy</Tag>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="sticky-column">
                      <div className="action-group">
                        <Select
                          disabled={item.cancelStatus === "REQUESTED"}
                          value={item.orderStatus}
                          loading={updatingId === item._id}
                          style={{
                            width: 180,
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(status) =>
                            handleUpdateStatus(item._id, status)
                          }
                          options={STATUS_OPTIONS.map((status) => ({
                            value: status,
                            label: STATUS_MAP[status]?.label || status,
                          }))}
                        />
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr>
                      <td colSpan={9} className="expanded-row">
                        <div className="expanded-content">
                          <h4>Danh sách sản phẩm</h4>

                          <div className="order-products">
                            {(
                              orderDetailsMap[item._id] ||
                              item.products ||
                              []
                            ).map((product, index) => (
                              <div
                                key={`${product._id || product.productId}-${index}`}
                                className="order-product-item"
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  gap: 12,
                                  alignItems: "center",
                                }}
                              >
                                <div>
                                  <strong>
                                    {product.productName ||
                                      product.name ||
                                      product.productId}
                                  </strong>

                                  <div>Số lượng: {product.quantity}</div>

                                  <div>
                                    Giá:{" "}
                                    {product.price?.toLocaleString("vi-VN")} đ
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        title="Lý do hủy đơn"
        open={isCancelModalVisible}
        onOk={handleConfirmCancel}
        onCancel={() => setIsCancelModalVisible(false)}
        okText="Xác nhận"
        cancelText="Hủy"
      >
        <div style={{ marginBottom: 16 }}>
          <strong>Lý do hủy</strong>
          <Input.TextArea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
            placeholder="Nhập lý do hủy đơn"
          />
        </div>

        <div>
          <strong>Ghi chú</strong>
          <Input.TextArea
            value={cancelMessage}
            onChange={(e) => setCancelMessage(e.target.value)}
            rows={3}
            placeholder="Nhập ghi chú (tuỳ chọn)"
          />
        </div>
      </Modal>

      <div className="pagination-wrapper">
        <Pagination
          current={meta.current}
          pageSize={meta.pageSize}
          total={meta.total}
          onChange={handlePaginationChange}
          showSizeChanger
          showQuickJumper
          pageSizeOptions={["10", "20", "50", "100"]}
        />
      </div>

      <OrderDetailEditModal
        visible={detailModalVisible}
        onClose={() => {
          setDetailModalVisible(false);
          setEditingDetail(null);
        }}
        detail={editingDetail}
        onSaved={async () => {
          if (!editingDetail) return;
          const res = await orderDetailsApi.findByOrder(
            editingDetail.orderId || editingDetail.orderId,
          );
          setOrderDetailsMap((prev) => ({
            ...prev,
            [editingDetail.orderId]: res?.data || res || [],
          }));
        }}
      />
    </div>
  );
};

export default OrderTable;
