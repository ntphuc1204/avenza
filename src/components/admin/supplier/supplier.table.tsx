"use client";

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
} from "antd";

import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { sendRequest } from "@/utils/api";

interface ISupplier {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}

interface IProps {
  suppliers: ISupplier[];
  accessToken?: string;
}

const SupplierTable = ({ suppliers, accessToken }: IProps) => {

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(
    null,
  );

  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [form] = Form.useForm();

  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");

      return;
    }

    setLoadingDelete(id);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers/${id}`,

        method: "DELETE",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data) {
        message.success("Xóa nhà cung cấp thành công");

        router.refresh();
      } else {
        message.error(res?.message || "Xóa nhà cung cấp thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi xóa nhà cung cấp");
    } finally {
      setLoadingDelete(null);
    }
  };

  const handleSave = async (values: any) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");

      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: values.name?.trim(),
        email: values.email?.trim(),
        phone: values.phone?.trim(),
        address: values.address?.trim(),
      };
      let res = null;

      if (editingSupplier) {
        res = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers/${editingSupplier._id}`,

          method: "PATCH",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          body: payload,
        });
      } else {
        res = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers`,

          method: "POST",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          body: payload,
        });
      }

      if (res?.data) {
        message.success(
          editingSupplier
            ? "Cập nhật nhà cung cấp thành công"
            : "Tạo nhà cung cấp thành công",
        );

        setIsModalOpen(false);

        setEditingSupplier(null);

        form.resetFields();

        router.refresh();
      } else {
        message.error(res?.message || "Thao tác thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi lưu nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* HEADER */}

      <div className="page-header">
        <h2 className="page-title">Quản lý nhà cung cấp</h2>

        <div className="page-actions">
          <Button
            type="primary"
            onClick={() => {
              setEditingSupplier(null);

              form.resetFields();

              setIsModalOpen(true);
            }}
          >
            + Thêm nhà cung cấp
          </Button>
        </div>
      </div>

      {/* TABLE */}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Địa chỉ</th>
              <th>Thời gian tạo</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className="table-name">{item.name}</div>
                </td>

                <td>{item.email || "-"}</td>

                <td>{item.phone || "-"}</td>

                <td>
                  <div className="table-subtext">{item.address || "-"}</div>
                </td>

                <td>
                  {item.createdAt
                    ? new Date(item.createdAt).toLocaleString("vi-VN")
                    : "-"}
                </td>

                <td className="sticky-column">
                  <div className="action-group">
                    <EditTwoTone
                      twoToneColor="#f57800"
                      className="action-icon"
                      onClick={() => {
                        setEditingSupplier(item);
                        setIsModalOpen(true);
                        form.setFieldsValue({
                          name: item.name,
                          email: item.email,
                          phone: item.phone,
                          address: item.address,
                        });
                      }}
                    />

                    <Popconfirm
                      title="Xóa nhà cung cấp?"
                      onConfirm={() => handleDelete(item._id)}
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

      <Modal
        title={editingSupplier ? "Cập nhật nhà cung cấp" : "Tạo nhà cung cấp"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Lưu"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Tên nhà cung cấp"
            rules={[{ required: true, message: "Vui lòng nhập tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="address" label="Địa chỉ">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierTable;
