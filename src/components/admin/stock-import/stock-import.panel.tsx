"use client";

import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Table,
  message,
} from "antd";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendRequest } from "@/utils/api";

interface IProps {
  products: any[];
  suppliers: any[];
  imports: any[];
  accessToken?: string;
}

const StockImportPanel = ({
  products,
  suppliers,
  imports,
  accessToken,
}: IProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onProductChange = (productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (product) {
      form.setFieldsValue({
        importPrice: product.importPrice ?? product.averageCostPrice ?? 0,
      });
    }
  };

  const onFinish = async (values: any) => {
    if (!accessToken) return;

    setLoading(true);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/stock-imports`,
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: {
          productId: values.productId,
          supplierId: values.supplierId,
          quantity: Number(values.quantity),
          importPrice: Number(values.importPrice),
          note: values.note,
        },
      });

      if (res?.data) {
        message.success("Nhập hàng thành công");
        form.resetFields();
        router.refresh();
      } else {
        message.error(res?.message || "Nhập hàng thất bại");
      }
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Sản phẩm",
      dataIndex: ["productId", "name"],
      render: (_: any, record: any) =>
        record.productId?.name || record.productId || "-",
    },
    {
      title: "Nhà cung cấp",
      dataIndex: ["supplierId", "name"],
      render: (_: any, record: any) =>
        record.supplierId?.name || record.supplierId || "-",
    },
    {
      title: "Số lượng",
      dataIndex: "quantity",
    },
    {
      title: "Giá nhập",
      dataIndex: "importPrice",
      render: (v: number) =>
        v != null ? `${Number(v).toLocaleString("vi-VN")} đ` : "-",
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
    },
    {
      title: "Thời gian",
      dataIndex: "createdAt",
      render: (v: string) => (v ? new Date(v).toLocaleString("vi-VN") : "-"),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">Nhập hàng</h2>
      </div>

      <Card title="Tạo phiếu nhập" style={{ marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Sản phẩm"
            name="productId"
            rules={[{ required: true, message: "Chọn sản phẩm" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn sản phẩm"
              onChange={onProductChange}
              options={products.map((p) => ({
                label: `${p.name} (tồn: ${p.stock ?? 0}, giá vốn: ${(p.costPrice ?? p.importPrice ?? 0).toLocaleString("vi-VN")} đ)`,
                value: p._id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Nhà cung cấp"
            name="supplierId"
            rules={[{ required: true, message: "Chọn nhà cung cấp" }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn nhà cung cấp"
              options={suppliers.map((s) => ({
                label: s.name,
                value: s._id,
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Số lượng nhập"
            name="quantity"
            rules={[{ required: true, message: "Nhập số lượng" }]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            label="Giá nhập"
            name="importPrice"
            rules={[{ required: true, message: "Nhập giá nhập" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label="Ghi chú" name="note">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading}>
            Xác nhận nhập hàng
          </Button>
        </Form>
      </Card>

      <Card title="Lịch sử nhập hàng">
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={imports}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default StockImportPanel;
