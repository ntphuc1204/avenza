"use client";

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
} from "antd";

import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { sendRequest } from "@/utils/api";

interface ICategory {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
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
    results: ICategory[];
  };

  accessToken?: string;
}

const CategoryTable = ({ data, accessToken }: IProps) => {
  const categories = data?.results || [];

  const meta = data?.meta || {
    current: 1,
    pageSize: 20,
    pages: 0,
    total: 0,
  };

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingCategory, setEditingCategory] = useState<ICategory | null>(
    null,
  );

  const [loadingDelete, setLoadingDelete] = useState<string | null>(null);

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
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories/${id}`,

        method: "DELETE",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data) {
        message.success("Xóa danh mục thành công");

        router.refresh();
      } else {
        message.error(res?.message || "Xóa danh mục thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi xóa danh mục");
    } finally {
      setLoadingDelete(null);
    }
  };

  const handleSave = async (values: any) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");

      return;
    }

    try {
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description,
      };

      let res = null;

      if (editingCategory) {
        res = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories/${editingCategory._id}`,

          method: "PATCH",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          body: payload,
        });
      } else {
        res = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories`,

          method: "POST",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          body: payload,
        });
      }

      if (res?.data) {
        message.success(
          editingCategory
            ? "Cập nhật danh mục thành công"
            : "Tạo danh mục thành công",
        );

        setIsModalOpen(false);

        setEditingCategory(null);

        form.resetFields();

        router.refresh();
      } else {
        message.error(res?.message || "Thao tác thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi lưu danh mục");
    }
  };

  return (
    <div className="page-wrapper">
      {/* HEADER */}

      <div className="page-header">
        <h2 className="page-title">Quản lý danh mục</h2>

        <div className="page-actions">
          <Button
            type="primary"
            onClick={() => {
              setEditingCategory(null);

              form.resetFields();

              setIsModalOpen(true);
            }}
          >
            + Thêm danh mục
          </Button>
        </div>
      </div>

      {/* TABLE */}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên danh mục</th>

              <th>Slug</th>

              <th>Mô tả</th>

              <th>Thời gian tạo</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((item) => (
              <tr key={item._id}>
                <td>
                  <div className="table-name">{item.name}</div>
                </td>

                <td>{item.slug || "-"}</td>

                <td>
                  <div className="table-subtext">{item.description || "-"}</div>
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
                        setEditingCategory(item);

                        setIsModalOpen(true);

                        form.setFieldsValue({
                          name: item.name,
                          slug: item.slug,
                          description: item.description,
                        });
                      }}
                    />

                    <Popconfirm
                      title="Xóa danh mục?"
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

      {/* PAGINATION */}

      <div className="pagination-wrapper">
        <Pagination
          current={meta.current}
          pageSize={meta.pageSize}
          total={meta.total}
          showSizeChanger
          pageSizeOptions={["10", "20", "50", "100"]}
        />
      </div>

      {/* MODAL */}

      <Modal
        title={editingCategory ? "Cập nhật danh mục" : "Tạo mới danh mục"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);

          setEditingCategory(null);

          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Lưu"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập tên danh mục",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="slug" label="Slug">
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryTable;
