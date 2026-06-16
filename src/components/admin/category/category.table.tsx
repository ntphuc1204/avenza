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

import { useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { sendRequest } from "@/utils/api";

interface ICategory {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE";
  productCount?: number;
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

  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const [form] = Form.useForm();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace, refresh } = useRouter();
  const [searchText, setSearchText] = useState(
    searchParams.get("search") ?? "",
  );

  const handleDelete = async (id: string) => {
    if (!accessToken) {
      message.error("Khong tim thay quyen truy cap");

      return;
    }

    setLoadingAction(id);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories/${id}`,

        method: "DELETE",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data) {
        message.success("Xoa vinh vien danh muc thanh cong");

        refresh();
      } else {
        message.error(res?.message || "Xoa danh muc that bai");
      }
    } catch (error) {
      message.error("Loi khi xoa danh muc");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleChangeStatus = async (
    id: string,
    action: "activate" | "deactivate",
  ) => {
    if (!accessToken) {
      message.error("Khong tim thay quyen truy cap");

      return;
    }

    setLoadingAction(id);

    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/categories/${id}/${action}`,

        method: "PATCH",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data) {
        message.success(
          action === "activate"
            ? "Kich hoat danh muc thanh cong"
            : "Ngung hoat dong danh muc thanh cong",
        );

        refresh();
      } else {
        message.error(res?.message || "Thao tac that bai");
      }
    } catch (error) {
      message.error("Loi khi cap nhat trang thai danh muc");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSave = async (values: any) => {
    if (!accessToken) {
      message.error("Khong tim thay quyen truy cap");

      return;
    }

    try {
      const payload: any = {
        name: values.name?.trim(),
      };

      if (values.slug?.trim()) {
        payload.slug = values.slug.trim();
      }

      if (values.description?.trim()) {
        payload.description = values.description.trim();
      }
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
            ? "Cap nhat danh muc thanh cong"
            : "Tao danh muc thanh cong",
        );

        setIsModalOpen(false);

        setEditingCategory(null);

        form.resetFields();

        refresh();
      } else {
        message.error(res?.message || "Thao tac that bai");
      }
    } catch (error) {
      message.error("Loi khi luu danh muc");
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

  const handlePagination = (page: number, pageSize: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("current", page.toString());
    params.set("pageSize", pageSize.toString());
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">Quan ly danh muc</h2>

        <div className="page-actions">
          <Input.Search
            placeholder="Tim theo ten, slug, mo ta"
            allowClear
            enterButton="Tim"
            value={searchText}
            style={{ width: 280, marginRight: 8 }}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
          <Button
            type="primary"
            onClick={() => {
              setEditingCategory(null);

              form.resetFields();

              setIsModalOpen(true);
            }}
          >
            + Them danh muc
          </Button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ten danh muc</th>
              <th>Slug</th>
              <th>Mo ta</th>
              <th>Trang thai</th>
              <th>So san pham</th>
              <th>Thoi gian tao</th>
              <th className="sticky-column">Hanh dong</th>
            </tr>
          </thead>

          <tbody>
            {categories.map((item) => {
              const productCount = item.productCount ?? 0;
              const isInactive = item.status === "INACTIVE";
              const statusAction = isInactive ? "activate" : "deactivate";

              return (
                <tr key={item._id}>
                  <td>
                    <div className="table-name">{item.name}</div>
                  </td>

                  <td>{item.slug || "-"}</td>

                  <td>
                    <div className="table-subtext">
                      {item.description || "-"}
                    </div>
                  </td>

                  <td>
                    <Tag color={isInactive ? "default" : "green"}>
                      {isInactive ? "Ngung hoat dong" : "Hoat dong"}
                    </Tag>
                  </td>

                  <td>{productCount}</td>

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
                        title={
                          isInactive
                            ? "Kich hoat danh muc?"
                            : "Ngung hoat dong danh muc?"
                        }
                        onConfirm={() =>
                          handleChangeStatus(item._id, statusAction)
                        }
                        okText={isInactive ? "Kich hoat" : "Ngung"}
                        cancelText="Huy"
                      >
                        <Button
                          size="small"
                          loading={loadingAction === item._id}
                        >
                          {isInactive ? "Kich hoat" : "Ngung"}
                        </Button>
                      </Popconfirm>

                      <Popconfirm
                        title="Xoa vinh vien danh muc?"
                        description={
                          productCount > 0
                            ? "Chi xoa duoc khi danh muc khong con san pham."
                            : undefined
                        }
                        onConfirm={() => handleDelete(item._id)}
                        okText="Xoa vinh vien"
                        cancelText="Huy"
                        disabled={productCount > 0}
                      >
                        <DeleteTwoTone
                          twoToneColor={productCount > 0 ? "#bfbfbf" : "#ff4d4f"}
                          className="action-icon"
                        />
                      </Popconfirm>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="pagination-wrapper">
        <Pagination
          current={meta.current}
          pageSize={meta.pageSize}
          total={meta.total}
          showSizeChanger
          pageSizeOptions={["10", "20", "50", "100"]}
          onChange={handlePagination}
          showTotal={(total, range) =>
            `${range[0]}-${range[1]} trong tong ${total} danh muc`
          }
        />
      </div>

      <Modal
        title={editingCategory ? "Cap nhat danh muc" : "Tao moi danh muc"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);

          setEditingCategory(null);

          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Luu"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Ten danh muc"
            rules={[
              { required: true, message: "Ten danh muc khong duoc trong" },
              { min: 3, message: "Ten toi thieu 3 ky tu" },
              { max: 255, message: "Ten toi da 255 ky tu" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            rules={[
              { min: 3, message: "Slug toi thieu 3 ky tu" },
              { max: 255, message: "Slug toi da 255 ky tu" },
              {
                pattern: /^[a-z0-9-]+$/,
                message: "Slug chi chua chu cai thuong, so va dau gach ngang",
              },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mo ta"
            rules={[{ max: 2000, message: "Mo ta toi da 2000 ky tu" }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CategoryTable;
