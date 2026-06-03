"use client";

import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
} from "antd";
import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";
import dayjs from "dayjs";
import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { sendRequest } from "@/utils/api";

interface IDiscount {
  _id: string;
  code: string;
  title: string;
  description?: string;
  type: string;
  value: number;
  minOrderValue: number;
  maxDiscountValue: number;
  quantity: number;
  used: number;
  expiredAt?: string;
  status: string;
  productIds?: string[];
  userIds?: string[];
}

interface IProps {
  data: IDiscount[];
  accessToken?: string;
}

const DiscountTable = ({ data, accessToken }: IProps) => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace, refresh } = useRouter();
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState(
    searchParams.get("search") ?? "",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<IDiscount | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);

  const openCreate = () => {
    setEditingDiscount(null);
    form.resetFields();
    form.setFieldsValue({
      type: "PERCENT",
      status: "ACTIVE",
      minOrderValue: 0,
      maxDiscountValue: 0,
      quantity: 0,
    });
    setIsModalOpen(true);
  };

  const openEdit = (discount: IDiscount) => {
    setEditingDiscount(discount);
    form.setFieldsValue({
      ...discount,
      expiredAt: discount.expiredAt ? dayjs(discount.expiredAt) : undefined,
      productIds: discount.productIds?.join(", "),
      userIds: discount.userIds?.join(", "),
    });
    setIsModalOpen(true);
  };

  const toArray = (value?: string) =>
    value
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

  const handleSave = async (values: any) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");
      return;
    }

    setLoading(true);

    const payload = {
      code: values.code,
      title: values.title,
      description: values.description || "",
      type: values.type,
      value: Number(values.value || 0),
      minOrderValue: Number(values.minOrderValue || 0),
      maxDiscountValue: Number(values.maxDiscountValue || 0),
      quantity: Number(values.quantity || 0),
      expiredAt: values.expiredAt?.toISOString(),
      status: values.status,
      productIds: toArray(values.productIds),
      userIds: toArray(values.userIds),
    };

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/discounts${
        editingDiscount ? `/${editingDiscount._id}` : ""
      }`,
      method: editingDiscount ? "PATCH" : "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: payload,
    });

    setLoading(false);

    if (res?.data) {
      message.success(editingDiscount ? "Đã cập nhật voucher" : "Đã tạo voucher");
      setIsModalOpen(false);
      setEditingDiscount(null);
      form.resetFields();
      refresh();
    } else {
      message.error(res?.message || "Thao tác thất bại");
    }
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    params.set("current", "1");
    replace(`${pathname}?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;

    setLoadingDelete(id);

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/discounts/${id}`,
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    setLoadingDelete(null);

    if (res?.data) {
      message.success("Đã xóa voucher");
      refresh();
    } else {
      message.error(res?.message || "Xóa voucher thất bại");
    }
  };

  const formatMoney = (value: number) => `${Number(value || 0).toLocaleString("vi-VN")} đ`;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">Quản lý voucher</h2>
        <div className="page-actions">
          <Input.Search
            placeholder="Tìm theo mã, tiêu đề, mô tả, trạng thái"
            allowClear
            enterButton="Tìm"
            value={searchText}
            style={{ width: 300, marginRight: 8 }}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
          <Button type="primary" onClick={openCreate}>
            + Thêm voucher
          </Button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã</th>
              <th>Tiêu đề</th>
              <th>Loại</th>
              <th>Điều kiện</th>
              <th>Số lượng</th>
              <th>HSD</th>
              <th>Trạng thái</th>
              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={item._id}>
                <td>
                  <Tag color="volcano">{item.code}</Tag>
                </td>
                <td>
                  <div className="table-name">{item.title}</div>
                  <div className="table-subtext">{item.description || "-"}</div>
                </td>
                <td>
                  {item.type === "PERCENT"
                    ? `${item.value}%`
                    : formatMoney(item.value)}
                </td>
                <td>
                  <Space direction="vertical" size={2}>
                    <span>Đơn từ {formatMoney(item.minOrderValue)}</span>
                    <span>Giảm tối đa {formatMoney(item.maxDiscountValue)}</span>
                  </Space>
                </td>
                <td>
                  {item.quantity ? `${item.used}/${item.quantity}` : `${item.used}/Không giới hạn`}
                </td>
                <td>
                  {item.expiredAt
                    ? new Date(item.expiredAt).toLocaleDateString("vi-VN")
                    : "-"}
                </td>
                <td>
                  <Tag color={item.status === "ACTIVE" ? "green" : "default"}>
                    {item.status}
                  </Tag>
                </td>
                <td className="sticky-column">
                  <div className="action-group">
                    <EditTwoTone
                      twoToneColor="#f57800"
                      className="action-icon"
                      onClick={() => openEdit(item)}
                    />
                    <Popconfirm
                      title="Xóa voucher?"
                      onConfirm={() => handleDelete(item._id)}
                      okText="Xóa"
                      cancelText="Hủy"
                    >
                      <DeleteTwoTone
                        twoToneColor="#ff4d4f"
                        className="action-icon"
                        spin={loadingDelete === item._id}
                      />
                    </Popconfirm>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        title={editingDiscount ? "Cập nhật voucher" : "Tạo voucher"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        confirmLoading={loading}
        width={720}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="code" label="Mã voucher" rules={[{ required: true }]}>
            <Input placeholder="SALE200" />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
            <Input placeholder="Giảm 20K cho đơn từ 200K" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Space style={{ width: "100%" }} size={16} align="start">
            <Form.Item name="type" label="Loại giảm" rules={[{ required: true }]}>
              <Select
                style={{ width: 180 }}
                options={[
                  { label: "Phần trăm", value: "PERCENT" },
                  { label: "Tiền mặt", value: "FIXED" },
                ]}
              />
            </Form.Item>
            <Form.Item name="value" label="Giá trị" rules={[{ required: true }]}>
              <InputNumber min={0} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="status" label="Trạng thái">
              <Select
                style={{ width: 160 }}
                options={[
                  { label: "ACTIVE", value: "ACTIVE" },
                  { label: "INACTIVE", value: "INACTIVE" },
                ]}
              />
            </Form.Item>
          </Space>
          <Space style={{ width: "100%" }} size={16} align="start">
            <Form.Item name="minOrderValue" label="Đơn tối thiểu">
              <InputNumber min={0} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="maxDiscountValue" label="Giảm tối đa">
              <InputNumber min={0} style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="quantity" label="Số lượng">
              <InputNumber min={0} style={{ width: 180 }} />
            </Form.Item>
          </Space>
          <Form.Item name="expiredAt" label="Hạn sử dụng">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="productIds" label="Giới hạn sản phẩm">
            <Input placeholder="Nhập productId, cách nhau bằng dấu phẩy" />
          </Form.Item>
          <Form.Item name="userIds" label="Giới hạn user">
            <Input placeholder="Nhập userId, cách nhau bằng dấu phẩy" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DiscountTable;

