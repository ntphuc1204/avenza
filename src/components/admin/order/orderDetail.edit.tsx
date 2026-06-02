"use client";

import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  notification,
} from "antd";
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
      if (detail?._id) {
        await orderDetailsApi.update(
          detail._id,
          values,
          session?.user?.access_token,
        );
        notification.success({ message: "Cập nhật chi tiết đơn thành công" });
      } else {
        // create new order detail
        const payload = { ...values, orderId: detail?.orderId };
        await orderDetailsApi.create(payload, session?.user?.access_token);
        notification.success({ message: "Thêm chi tiết đơn thành công" });
      }

      onSaved();
      onClose();
    } catch (e: any) {
      notification.error({ message: e?.message || "Lỗi" });
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      title="Chỉnh sửa chi tiết đơn"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="productName"
          label="Tên sản phẩm"
          rules={[
            { required: true, message: "Tên sản phẩm không được trống" },
            { min: 3, message: "Tên sản phẩm tối thiểu 3 ký tự" },
            { max: 255, message: "Tên sản phẩm tối đa 255 ký tự" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="quantity"
          label="Số lượng"
          rules={[
            { required: true, message: "Số lượng không được trống" },
            { pattern: /^\d+$/, message: "Số lượng phải là số dương" },
          ]}
        >
          <InputNumber min={1} max={99999} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="price"
          label="Giá"
          rules={[
            { required: true, message: "Giá không được trống" },
            { pattern: /^\d+$/, message: "Giá phải là số dương" },
          ]}
        >
          <InputNumber min={0} max={999999999} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="sku"
          label="SKU"
          rules={[{ max: 50, message: "SKU tối đa 50 ký tự" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="status" label="Trạng thái">
          <Select>
            <Select.Option value="PENDING">PENDING</Select.Option>
            <Select.Option value="PROCESSING">PROCESSING</Select.Option>
            <Select.Option value="CANCELLED">CANCELLED</Select.Option>
          </Select>
        </Form.Item>

        <div style={{ textAlign: "right" }}>
          <Button style={{ marginRight: 8 }} onClick={onClose}>
            Hủy
          </Button>
          <Button type="primary" onClick={handleSave}>
            Lưu
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default OrderDetailEditModal;
