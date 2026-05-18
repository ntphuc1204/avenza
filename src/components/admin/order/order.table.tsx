"use client";

import { Button, message, Select, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendRequest } from "@/utils/api";

interface IOrderProduct {
  productId: string;
  quantity: number;
  price: number;
  name?: string;
  image?: string;
}

interface IOrder {
  _id: string;
  userId?: any;
  products: IOrderProduct[];
  totalPrice: number;
  shippingAddress?: string;
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

const OrderTable = (props: IProps) => {
  const { data, accessToken } = props;
  const orders = data?.results || [];
  const meta = data?.meta || {
    current: 1,
    pageSize: 20,
    pages: 0,
    total: 0,
  };
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const columns: ColumnsType<IOrder> = useMemo(
    () => [
      {
        title: "#",
        width: 60,
        render: (_: any, __: IOrder, index: number) => index + 1,
      },
      {
        title: "Mã đơn",
        dataIndex: "_id",
        width: 220,
      },
      {
        title: "Khách hàng",
        dataIndex: "userId",
        width: 180,
        render: (userId: any) => {
          if (!userId) return "-";
          return typeof userId === "string"
            ? userId
            : userId?.email || userId?._id || "-";
        },
      },
      {
        title: "Tổng tiền",
        dataIndex: "totalPrice",
        width: 160,
        render: (price: number) => `${price?.toLocaleString("vi-VN")} đ`,
      },
      {
        title: "Trạng thái đơn hàng",
        dataIndex: "orderStatus",
        width: 180,
        render: (status: string) => {
          const color =
            status === "DELIVERED"
              ? "green"
              : status === "CANCELLED"
                ? "red"
                : "orange";
          return <Tag color={color}>{status}</Tag>;
        },
      },
      {
        title: "Trạng thái thanh toán",
        dataIndex: "paymentStatus",
        width: 180,
        render: (status: string) => {
          const color =
            status === "SUCCESS"
              ? "green"
              : status === "FAILED"
                ? "red"
                : "orange";
          return <Tag color={color}>{status}</Tag>;
        },
      },
      {
        title: "Phương thức",
        dataIndex: "paymentMethod",
        width: 140,
      },
      {
        title: "Địa chỉ",
        dataIndex: "shippingAddress",
      },
      {
        title: "Hành động",
        width: 220,
        render: (_: any, record: IOrder) => (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Select
              value={record.orderStatus}
              style={{ width: 180 }}
              onChange={async (status) => {
                if (!accessToken) {
                  message.error("Không tìm thấy quyền truy cập");
                  return;
                }
                setUpdatingId(record._id);
                try {
                  const res = await sendRequest<IBackendRes<any>>({
                    url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/orders/${record._id}/status`,
                    method: "PUT",
                    headers: {
                      Authorization: `Bearer ${accessToken}`,
                    },
                    body: {
                      _id: record._id,
                      status,
                    },
                  });
                  if (res?.data) {
                    message.success("Cập nhật trạng thái đơn hàng thành công");
                    router.refresh();
                  } else {
                    message.error(res?.message || "Cập nhật thất bại");
                  }
                } catch (error) {
                  message.error("Lỗi khi cập nhật trạng thái");
                } finally {
                  setUpdatingId(null);
                }
              }}
              options={STATUS_OPTIONS.map((status) => ({
                value: status,
                label: status,
              }))}
            />
          </div>
        ),
      },
    ],
    [accessToken, router],
  );

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>Quản lý đơn hàng</h2>
      </div>
      <Table
        rowKey={(record) => record._id}
        dataSource={orders}
        columns={columns}
        bordered
        expandable={{
          expandedRowRender: (record) => (
            <div>
              <div style={{ marginBottom: 12 }}>
                <strong>Sản phẩm:</strong>
              </div>
              {record.products?.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  style={{ marginBottom: 8, paddingLeft: 12 }}
                >
                  <div>
                    <strong>{item.name || item.productId}</strong>
                  </div>
                  <div>Số lượng: {item.quantity}</div>
                  <div>Giá: {item.price?.toLocaleString("vi-VN")} đ</div>
                </div>
              ))}
            </div>
          ),
        }}
        pagination={{
          current: meta.current,
          pageSize: meta.pageSize,
          total: meta.total,
          showSizeChanger: true,
        }}
      />
    </div>
  );
};

export default OrderTable;
