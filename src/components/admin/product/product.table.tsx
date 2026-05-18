"use client";

import { useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";

import { Button, Pagination, Popconfirm, message } from "antd";

import ProductCreate from "./product.create";
import ProductUpdate from "./product.update";

import { handleDeleteProductAction } from "@/utils/actions";

interface IProduct {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  stock: number;
  images?: string[];
  categoryId?: {
    _id: string;
    name: string;
  };
  isFeatured?: boolean;
  status?: string;
  createdAt: string;
  updatedAt: string;
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
    results: IProduct[];
  };

  categories?: any[];
}

const ProductTable = ({ data, categories = [] }: IProps) => {
  const products = data?.results || [];

  const meta = data?.meta || {
    current: 1,
    pageSize: 10,
    pages: 0,
    total: 0,
  };

  const pathname = usePathname();

  const searchParams = useSearchParams();

  const { replace } = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  const [dataUpdate, setDataUpdate] = useState<IProduct | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const renderImage = (images?: string[]) => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    const image = images?.[0];

    return image
      ? image.startsWith("http")
        ? image
        : `${baseUrl}${image}`
      : "/images/no-image.png";
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const res = await handleDeleteProductAction(id);

      if (res?.data) {
        message.success("Xóa sản phẩm thành công!");

        window.location.reload();
      } else {
        message.error(res?.message || "Lỗi khi xóa sản phẩm");
      }
    } catch (error) {
      message.error("Lỗi khi xóa sản phẩm");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePagination = (page: number, pageSize: number) => {
    const params = new URLSearchParams(searchParams);

    params.set("current", page.toString());

    params.set("pageSize", pageSize.toString());

    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="page-wrapper">
      {/* HEADER */}

      <div className="page-header">
        <h2 className="page-title">Quản lý sản phẩm</h2>

        <div className="page-actions">
          <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
            + Thêm sản phẩm
          </Button>
        </div>
      </div>

      {/* TABLE */}

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ảnh</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Giá</th>
              <th>Kho</th>
              <th>Trạng thái</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {products.map((item) => (
              <tr key={item._id}>
                <td>
                  <img
                    src={renderImage(item.images)}
                    alt={item.name}
                    className="table-image"
                  />
                </td>

                <td>
                  <div className="table-name">{item.name}</div>

                  <div className="table-subtext">{item.slug}</div>
                </td>

                <td>{item.categoryId?.name || "-"}</td>

                <td>{item.price?.toLocaleString("vi-VN")} đ</td>

                <td>{item.stock}</td>

                <td>
                  <span
                    className={`status-badge ${
                      item.status === "ACTIVE"
                        ? "status-active"
                        : "status-inactive"
                    }`}
                  >
                    {item.status === "ACTIVE" ? "Hoạt động" : "Ẩn"}
                  </span>
                </td>

                <td className="sticky-column">
                  <div className="action-group">
                    <EditTwoTone
                      twoToneColor="#f57800"
                      className="action-icon"
                      onClick={() => {
                        setDataUpdate(item);

                        setIsUpdateModalOpen(true);
                      }}
                    />

                    <Popconfirm
                      title="Xóa sản phẩm?"
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
            `${range[0]}-${range[1]} trong tổng ${total} sản phẩm`
          }
        />
      </div>

      {/* MODALS */}

      <ProductCreate
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        categories={categories}
      />

      <ProductUpdate
        isUpdateModalOpen={isUpdateModalOpen}
        setIsUpdateModalOpen={setIsUpdateModalOpen}
        dataUpdate={dataUpdate}
        setDataUpdate={setDataUpdate}
        categories={categories}
      />
    </div>
  );
};

export default ProductTable;
