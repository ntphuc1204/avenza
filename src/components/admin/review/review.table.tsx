"use client";

import { Button, Form, Input, message, Modal, Popconfirm, Space, Table, Tag } from "antd";
import { ColumnsType } from "antd/es/table";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { sendRequest } from "@/utils/api";

interface IReview {
  _id: string;
  productId?: any;
  user?: any;
  rating: number;
  comment?: string;
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
    results: IReview[];
  };
  accessToken?: string;
}

const ReviewTable = (props: IProps) => {
  const { data, accessToken } = props;
  const reviews = data?.results || [];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<IReview | null>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  const handleSave = async (values: any) => {
    if (!accessToken || !editingReview) {
      message.error("Không tìm thấy quyền truy cập hoặc review");
      return;
    }

    const res = await sendRequest<IBackendRes<any>>({
      url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reviews/${editingReview._id}`,
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: {
        rating: Number(values.rating),
        comment: values.comment,
      },
    });

    if (res?.data) {
      message.success("Cập nhật review thành công");
      setIsModalOpen(false);
      setEditingReview(null);
      form.resetFields();
      router.refresh();
    } else {
      message.error(res?.message || "Cập nhật thất bại");
    }
  };

  const columns: ColumnsType<IReview> = useMemo(
    () => [
      {
        title: "#",
        width: 60,
        render: (_: any, __: IReview, index: number) => index + 1,
      },
      {
        title: "Mã sản phẩm",
        dataIndex: "productId",
        width: 200,
        render: (productId) => (productId?._id || productId || "-"),
      },
      {
        title: "Người đánh giá",
        dataIndex: "user",
        width: 220,
        render: (user) => user?.email || user?._id || "-",
      },
      {
        title: "Rating",
        dataIndex: "rating",
        width: 120,
        render: (rating) => <Tag color="gold">{rating}</Tag>,
      },
      {
        title: "Nội dung",
        dataIndex: "comment",
      },
      {
        title: "Thời gian",
        width: 180,
        render: (_: any, record: IReview) => record.createdAt ? new Date(record.createdAt).toLocaleString() : "-",
      },
      {
        title: "Hành động",
        width: 180,
        render: (_: any, record: IReview) => (
          <Space>
            <Button
              type="default"
              onClick={() => {
                setEditingReview(record);
                form.setFieldsValue({ rating: record.rating, comment: record.comment });
                setIsModalOpen(true);
              }}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xác nhận xóa review này?"
              onConfirm={async () => {
                if (!accessToken) {
                  message.error("Không tìm thấy quyền truy cập");
                  return;
                }

                const res = await sendRequest<IBackendRes<any>>({
                  url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reviews/${record._id}`,
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${accessToken}`,
                  },
                });
                if (res?.data) {
                  message.success("Xóa review thành công");
                  router.refresh();
                } else {
                  message.error(res?.message || "Xóa thất bại");
                }
              }}
              okText="Xóa"
              cancelText="Hủy"
            >
              <Button danger type="primary">
                Xóa
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [accessToken, form, router],
  );

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Quản lý Reviews</h2>
      </div>
      <Table
        rowKey={(record) => record._id}
        dataSource={reviews}
        columns={columns}
        bordered
        pagination={false}
      />

      <Modal
        title="Cập nhật review"
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingReview(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Lưu"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="rating" label="Rating" rules={[{ required: true, message: "Vui lòng nhập rating" }]}>
            <Input type="number" min={1} max={5} />
          </Form.Item>
          <Form.Item name="comment" label="Nội dung">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReviewTable;
