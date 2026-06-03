"use client";

import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Tag,
} from "antd";

import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useState } from "react";

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

const ReviewTable = ({ data, accessToken }: IProps) => {
  const reviews = data?.results || [];

  const meta = data?.meta || {
    current: 1,
    pageSize: 10,
    pages: 0,
    total: 0,
  };

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const { replace, refresh } = useRouter();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingReview, setEditingReview] = useState<IReview | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState(
    searchParams.get("search") ?? "",
  );

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

  const handlePagination = (page: number, pageSize: number) => {
    const params = new URLSearchParams(searchParams);

    params.set("current", page.toString());

    params.set("pageSize", pageSize.toString());

    replace(`${pathname}?${params.toString()}`);
  };

  const handleSave = async (values: any) => {
    if (!accessToken || !editingReview) {
      message.error("Không tìm thấy quyền truy cập hoặc review");
      return;
    }

    try {
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

        refresh();
      } else {
        message.error(res?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi cập nhật review");
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");
      return;
    }

    setDeletingId(id);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/reviews/${id}`,

        method: "DELETE",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data) {
        message.success("Xóa review thành công");

        refresh();
      } else {
        message.error(res?.message || "Xóa thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi xóa review");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      {/* HEADER */}

      <div className="page-header">
        <h2 className="page-title">Quản lý Reviews</h2>
        <div className="page-actions">
          <Input.Search
            placeholder="Tìm theo nội dung, email, tên SP, mã"
            allowClear
            enterButton="Tìm"
            value={searchText}
            style={{ width: 320 }}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
        </div>
      </div>

      {/* TABLE */}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>STT</th>

              <th>Mã sản phẩm</th>

              <th>Người đánh giá</th>

              <th>Rating</th>

              <th>Nội dung</th>

              <th>Thời gian</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {reviews.map((item, index) => (
              <tr key={item._id}>
                <td>{index + 1 + (meta.current - 1) * meta.pageSize}</td>

                <td>
                  {typeof item.productId === "object"
                    ? item.productId?.name || item.productId?._id
                    : item.productId || "-"}
                </td>

                <td>
                  {typeof item.user === "object"
                    ? item.user?.email || item.user?._id
                    : item.user || "-"}
                </td>

                <td>
                  <Tag color="gold">{item.rating}</Tag>
                </td>

                <td>
                  <div className="table-description">{item.comment || "-"}</div>
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
                        setEditingReview(item);

                        form.setFieldsValue({
                          rating: item.rating,
                          comment: item.comment,
                        });

                        setIsModalOpen(true);
                      }}
                    />

                    <Popconfirm
                      title="Xác nhận xóa review?"
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
          showQuickJumper
          pageSizeOptions={["10", "20", "50", "100"]}
          onChange={handlePagination}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} trong tổng ${total} reviews`
          }
        />
      </div>

      {/* MODAL */}

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
          <Form.Item
            name="rating"
            label="Rating"
            rules={[
              {
                required: true,
                message: "Vui lòng nhập rating",
              },
            ]}
          >
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
