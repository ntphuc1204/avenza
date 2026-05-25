"use client";

import { Modal, Form, Input, InputNumber, Select, Button, notification } from "antd";
import { useEffect } from "react";
import orderDetailsApi from "@/utils/orderDetails.api";
import { useSession } from "next-auth/react";

const OrderDetailEditModal = ({ visible, onClose, detail, onSaved }: any) => {
  const [form] = Form.useForm();
  const { data: session } = useSession();

  useEffect(() => {
    if (detail) {
      form.setFieldsValue(detail);
    } else {
      form.resetFields();
    }
  }, [detail]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!detail?._id) throw new Error("Missing id");
      await orderDetailsApi.update(detail._id, values, session?.user?.access_token);
      notification.success({ message: "Cập nhật chi tiết đơn thành công" });
      onSaved();
      onClose();
    } catch (e: any) {
      notification.error({ message: e?.message || "Lỗi" });
    }
  };

  return (
    <Modal open={visible} onCancel={onClose} footer={null} title="Chỉnh sửa chi tiết đơn">
      <Form form={form} layout="vertical">
        <Form.Item name="productName" label="Tên sản phẩm" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="quantity" label="Số lượng" rules={[{ required: true }]}>
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="price" label="Giá" rules={[{ required: true }]}>
          <InputNumber min={0} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="sku" label="SKU">
          <Input />
        </Form.Item>

        <Form.Item name="status" label="Trạng thái">
          <Select>
            <Select.Option value="PENDING">PENDING</Select.Option>
            <Select.Option value="PROCESSING">PROCESSING</Select.Option>
            <Select.Option value="CANCELLED">CANCELLED</Select.Option>
          </Select>
        </Form.Item>

        <div style={{ textAlign: 'right' }}>
          <Button style={{ marginRight: 8 }} onClick={onClose}>Hủy</Button>
          <Button type="primary" onClick={handleSave}>Lưu</Button>
        </div>
      </Form>
    </Modal>
  );
};

export default OrderDetailEditModal;
