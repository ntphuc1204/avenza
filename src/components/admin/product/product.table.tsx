"use client";

import { useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";

import { Button, Pagination, Popconfirm, message, Input, Space } from "antd";

import ProductCreate from "./product.create";
import ProductUpdate from "./product.update";

import { handleDeleteProductAction } from "@/utils/actions";

interface IProduct {
  _id: string;
  name: string;
  slug?: string;
  description?: string;
  price: number;
  importPrice?: number;
  stock: number;

  // 👇 cho phép nhiều kiểu dữ liệu
  images?: any;

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
  suppliers?: any[];
  accessToken: string;
}

const ProductTable = ({
  data,
  categories = [],
  suppliers = [],
  accessToken,
}: IProps) => {
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
  const [searchText, setSearchText] = useState(
    searchParams.get("search") ?? "",
  );

  // =========================
  // FIX IMAGE
  // =========================
  const renderImage = (images?: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    // không có ảnh
    if (!images) {
      return "/images/no-image.png";
    }

    // nếu images là string
    if (typeof images === "string") {
      return images.startsWith("http") ? images : `${baseUrl}${images}`;
    }

    // nếu images là array
    if (Array.isArray(images) && images.length > 0) {
      const firstImage = images[0];

      // array string[]
      if (typeof firstImage === "string") {
        return firstImage.startsWith("http")
          ? firstImage
          : `${baseUrl}${firstImage}`;
      }

      // array object[]
      if (typeof firstImage === "object" && firstImage?.url) {
        return firstImage.url.startsWith("http")
          ? firstImage.url
          : `${baseUrl}${firstImage.url}`;
      }
    }

    return "/images/no-image.png";
  };

  // =========================
  // DELETE
  // =========================
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

  // =========================
  // SEARCH + PAGINATION
  // =========================
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
      {/* HEADER */}

      <div className="page-header">
        <h2 className="page-title">Quản lý sản phẩm</h2>

        <div className="page-actions">
          <Space.Compact>
            <Input.Search
              placeholder="Tìm sản phẩm theo tên hoặc mô tả"
              allowClear
              enterButton="Tìm"
              value={searchText}
              style={{ width: 320 }}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
            />

            <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Thêm sản phẩm
            </Button>
          </Space.Compact>
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
              <th>Giá bán</th>
              <th>Giá nhập</th>
              <th>Lợi nhuận</th>
              <th>Kho</th>
              <th>Trạng thái</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {products.map((item) => (
              <tr key={item._id}>
                {/* IMAGE */}
                <td>
                  <img
                    src={renderImage(item.images)}
                    alt={item.name}
                    className="table-image"
                    style={{
                      width: 70,
                      height: 70,
                      objectFit: "cover",
                      borderRadius: 8,
                      border: "1px solid #eee",
                    }}
                  />
                </td>

                {/* NAME */}
                <td>
                  <div className="table-name">{item.name}</div>

                  <div className="table-subtext">{item.slug}</div>
                </td>

                {/* CATEGORY */}
                <td>{item.categoryId?.name || "-"}</td>

                {/* PRICE */}
                <td>{item.price?.toLocaleString("vi-VN")} đ</td>

                <td>{(item.importPrice ?? 0).toLocaleString("vi-VN")} đ</td>

                <td>
                  {item.price > 0 && item.importPrice != null ? (
                    <span style={{ color: "#52c41a" }}>
                      {(item.price - (item.importPrice ?? 0)).toLocaleString(
                        "vi-VN",
                      )}{" "}
                      đ (
                      {Math.round(
                        ((item.price - (item.importPrice ?? 0)) / item.price) *
                          100,
                      )}
                      %)
                    </span>
                  ) : (
                    "-"
                  )}
                </td>

                {/* STOCK */}
                <td>{item.stock}</td>

                {/* STATUS */}
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

                {/* ACTION */}
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
        suppliers={suppliers}
        accessToken={accessToken}
      />

      <ProductUpdate
        isUpdateModalOpen={isUpdateModalOpen}
        setIsUpdateModalOpen={setIsUpdateModalOpen}
        dataUpdate={dataUpdate}
        setDataUpdate={setDataUpdate}
        categories={categories}
        suppliers={suppliers}
        accessToken={accessToken}
      />
    </div>
  );
};

export default ProductTable;
