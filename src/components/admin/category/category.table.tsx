"use client";

import { Button, Form, Input, message, Modal, Popconfirm, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
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

const CategoryTable = (props: IProps) => {
  const { data, accessToken } = props;
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
  const [form] = Form.useForm();
  const router = useRouter();

  const columns: ColumnsType<ICategory> = useMemo(
    () => [
      {
        title: "#",
        width: 60,
        render: (_: any, __: ICategory, index: number) => index + 1,
      },
      {
        title: "Tên danh mục",
        dataIndex: "name",
        width: 220,
      },
      {
        title: "Slug",
        dataIndex: "slug",
        width: 180,
      },
      {
        title: "Mô tả",
        dataIndex: "description",
      },
      {
        title: "Thời gian",
        width: 180,
        render: (_: any, record: ICategory) => {
          return record.createdAt
            ? new Date(record.createdAt).toLocaleString()
            : "-";
        },
      },
      {
        title: "Hành động",
        width: 160,
        render: (_: any, record: ICategory) => (
          <div style={{ display: "flex", gap: 10 }}>
            <Button
              type="default"
              onClick={() => {
                setEditingCategory(record);
                setIsModalOpen(true);
                form.setFieldsValue({
                  name: record.name,
                  slug: record.slug,
                  description: record.description,
                });
              }}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xác nhận xóa danh mục này?"
              onConfirm={async () => {
                if (!accessToken) {
                  message.error("Không tìm thấy quyền truy cập");
                  return;
                }

                const res = await sendRequest<IBackendRes<any>>({
                  url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories/${record._id}`,
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
              }}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger type="primary">
                Xóa
              </Button>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [accessToken, form, router],
  );

  const handleSave = async (values: any) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");
      return;
    }

    try {
      const payload: any = {
        name: values.name,
        slug: values.slug,
        description: values.description,
      };

      let res: IBackendRes<any> | null = null;

      if (editingCategory) {
        payload._id = editingCategory._id;
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
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2>Quản lý danh mục</h2>
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

      <Table
        rowKey={(record) => record._id}
        dataSource={categories}
        columns={columns}
        bordered
        pagination={{
          current: meta.current,
          pageSize: meta.pageSize,
          total: meta.total,
          showSizeChanger: true,
        }}
      />

      <Modal
        title={editingCategory ? "Cập nhật danh mục" : "Tạo mới danh mục"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
          form.resetFields();
        }}
        onOk={() => {
          form.submit();
        }}
        okText="Lưu"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Tên danh mục"
            rules={[{ required: true, message: "Vui lòng nhập tên danh mục" }]}
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
