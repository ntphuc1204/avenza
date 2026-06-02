"use client";

import { Modal, Form, Input, Select, Button, notification } from "antd";
import { useEffect } from "react";
import { rolesApi } from "@/utils/roles.api";
import { useSession } from "next-auth/react";

const { Option } = Select;

const RoleCreateModal = ({ visible, onClose, editing }: any) => {
  const [form] = Form.useForm();
  const { data: session } = useSession();

  useEffect(() => {
    if (editing) form.setFieldsValue(editing);
    else form.resetFields();
  }, [editing]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editing?._id) {
        await rolesApi.update(editing._id, values, session?.user?.access_token);
        notification.success({ message: "Cập nhật role thành công" });
      } else {
        await rolesApi.create(values, session?.user?.access_token);
        notification.success({ message: "Tạo role thành công" });
      }
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
      title={editing ? "Sửa role" : "Tạo role"}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Tên"
          rules={[
            { required: true, message: "Tên role không được trống" },
            { min: 2, message: "Tên tối thiểu 2 ký tự" },
            { max: 100, message: "Tên tối đa 100 ký tự" },
            {
              pattern: /^[A-Z_]+$/,
              message: "Tên role chỉ chứa chữ hoa và dấu gạch dưới",
            },
          ]}
        >
          <Input placeholder="VD: ADMIN, MANAGER, USER" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ max: 500, message: "Mô tả tối đa 500 ký tự" }]}
        >
          <Input placeholder="Mô tả role" />
        </Form.Item>

        <Form.Item name="permissions" label="Permissions">
          <Select
            mode="tags"
            placeholder="Thêm permissions (ví dụ: READ_PRODUCTS)"
          ></Select>
        </Form.Item>

        <div style={{ textAlign: "right" }}>
          <Button style={{ marginRight: 8 }} onClick={onClose}>
            Hủy
          </Button>
          <Button type="primary" onClick={handleOk}>
            Lưu
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default RoleCreateModal;
