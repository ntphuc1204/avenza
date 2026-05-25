"use client";

import { message, Pagination, Select, Tag, Button, Modal, Space, Popconfirm } from "antd";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { sendRequest } from "@/utils/api";
import orderDetailsApi from '@/utils/orderDetails.api';
import OrderDetailEditModal from './orderDetail.edit';

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
  const [orderDetailsMap, setOrderDetailsMap] = useState<Record<string, any[]>>({});
  const [editingDetail, setEditingDetail] = useState<any | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

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

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">Quản lý đơn hàng</h2>
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

              <th>Sản phẩm</th>

              <th>Yêu cầu hủy</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((item) => {
              const isExpanded = expandedRows.includes(item._id);

              return (
                <>
                  <tr key={item._id}>
                    <td>
                      <div className="table-subtext">{item._id}</div>
                    </td>

                    <td>
                      {typeof item.userId === "string"
                        ? item.userId
                        : item.userId?.email || item.userId?._id || "-"}
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
                            item.orderStatus === "DELIVERED"
                              ? "green"
                              : item.orderStatus === "CANCELLED"
                                ? "red"
                                : "orange"
                          }
                        >
                          {item.orderStatus}
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
                            onClick={() => handleApproveCancel(item._id)}
                          >
                            Xác nhận hủy
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

                  {isExpanded && (
                    <tr>
                      <td colSpan={10} className="expanded-row">
                        <div className="expanded-content">
                          <h4>Danh sách sản phẩm</h4>

                            <div className="order-products">
                              {(orderDetailsMap[item._id] || item.products || []).map((product, index) => (
                                <div
                                  key={`${product._id || product.productId}-${index}`}
                                  className="order-product-item"
                                  style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}
                                >
                                  <div>
                                    <strong>
                                      {product.productName || product.name || product.productId}
                                    </strong>

                                    <div>Số lượng: {product.quantity}</div>

                                    <div>Giá: {product.price?.toLocaleString("vi-VN")} đ</div>
                                  </div>

                                  <div>
                                    <Space>
                                      <Button size="small" onClick={async () => {
                                        // open edit modal
                                        setEditingDetail(product);
                                        setDetailModalVisible(true);
                                      }}>
                                        Sửa
                                      </Button>

                                      <Popconfirm title="Xác nhận xóa?" onConfirm={async () => {
                                        if (!product._id) {
                                          message.error('Không có id để xóa');
                                          return;
                                        }
                                        try {
                                          await orderDetailsApi.remove(product._id, accessToken);
                                          message.success('Đã xóa chi tiết đơn');
                                          // refresh
                                          const res = await orderDetailsApi.findByOrder(item._id);
                                          setOrderDetailsMap(prev => ({ ...prev, [item._id]: res?.data || res || [] }));
                                        } catch (e) {
                                          message.error('Xóa thất bại');
                                        }
                                      }}>
                                        <Button danger size="small">Xóa</Button>
                                      </Popconfirm>
                                    </Space>
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

      <OrderDetailEditModal
        visible={detailModalVisible}
        onClose={() => { setDetailModalVisible(false); setEditingDetail(null); }}
        detail={editingDetail}
        onSaved={async () => {
          if (!editingDetail) return;
          const res = await orderDetailsApi.findByOrder(editingDetail.orderId || editingDetail.orderId);
          setOrderDetailsMap(prev => ({ ...prev, [editingDetail.orderId]: res?.data || res || [] }));
        }}
      />
    </div>
  );
};

export default OrderTable;
