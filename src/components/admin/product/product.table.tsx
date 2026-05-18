"use client";

import { handleDeleteProductAction } from "@/utils/actions";

import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";

import { Button, Popconfirm, Table, message, Tag } from "antd";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useState } from "react";

import ProductCreate from "./product.create";
import ProductUpdate from "./product.update";

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

const ProductTable = (props: IProps) => {
  const { data, categories = [] } = props;

  const products = data?.results || [];

  const meta = data?.meta || {
    current: 1,
    pageSize: 10,
    pages: 0,
    total: 0,
  };

  const searchParams = useSearchParams();

  const pathname = usePathname();

  const { replace } = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

  const [dataUpdate, setDataUpdate] = useState<IProduct | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const columns = [
    {
      title: "STT",
      width: 70,
      fixed: "left" as const,

      render: (_: any, record: IProduct, index: number) => {
        return <>{index + 1 + (meta.current - 1) * meta.pageSize}</>;
      },
    },

    {
      title: "Ảnh",
      dataIndex: "images",
      width: 100,

      render: (images: string[]) => {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

        const image = images?.[0];

        const placeholderSrc =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f0f2f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='10'%3EPRODUCT%3C/text%3E%3C/svg%3E";

        const src = image
          ? image.startsWith("http")
            ? image
            : `${baseUrl}${image}`
          : placeholderSrc;

        return (
          <img
            src={src}
            alt="product"
            style={{
              width: 48,
              height: 48,
              objectFit: "cover",
              borderRadius: 8,
            }}
          />
        );
      },

      responsive: ["sm"] as any,
    },

    {
      title: "Tên sản phẩm",
      dataIndex: "name",
      width: 220,
      ellipsis: true,
    },

    {
      title: "Slug",
      dataIndex: "slug",
      width: 220,
      ellipsis: true,
      responsive: ["lg"] as any,
    },

    {
      title: "Giá",
      dataIndex: "price",
      width: 140,

      render: (price: number) => {
        return `${price?.toLocaleString("vi-VN")} đ`;
      },
    },

    {
      title: "Kho",
      dataIndex: "stock",
      width: 100,
    },

    {
      title: "Danh mục",
      width: 180,

      render: (_: any, record: IProduct) => {
        return record?.categoryId?.name || "-";
      },
    },

    {
      title: "Nổi bật",
      width: 120,

      render: (_: any, record: IProduct) => {
        return record?.isFeatured ? (
          <Tag color="green">Nổi bật</Tag>
        ) : (
          <Tag>Thường</Tag>
        );
      },
    },

    {
      title: "Trạng thái",
      width: 140,

      render: (_: any, record: IProduct) => {
        return (
          <span
            style={{
              color: record.status === "ACTIVE" ? "#52c41a" : "#ff4d4f",

              fontWeight: "bold",
            }}
          >
            {record.status === "ACTIVE" ? "✓ Hoạt động" : "✗ Ẩn"}
          </span>
        );
      },
    },

    {
      title: "Hành động",
      fixed: "right" as const,
      width: 120,

      render: (_: any, record: IProduct) => {
        return (
          <div
            style={{
              display: "flex",
              gap: "10px",
            }}
          >
            <EditTwoTone
              twoToneColor="#f57800"
              style={{
                cursor: "pointer",
                fontSize: "16px",
              }}
              onClick={() => {
                setIsUpdateModalOpen(true);

                setDataUpdate(record);
              }}
            />

            <Popconfirm
              placement="leftTop"
              title="Xác nhận xóa sản phẩm"
              description="Bạn có chắc chắn muốn xóa sản phẩm này không?"
              onConfirm={async () => {
                setDeletingId(record._id);

                try {
                  const res = await handleDeleteProductAction(record?._id);

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
              }}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{
                danger: true,
                loading: deletingId === record._id,
              }}
            >
              <span style={{ cursor: "pointer" }}>
                <DeleteTwoTone
                  twoToneColor="#ff4d4f"
                  style={{
                    fontSize: "16px",
                  }}
                />
              </span>
            </Popconfirm>
          </div>
        );
      },
    },
  ];

  const onChange = (pagination: any) => {
    if (pagination?.current) {
      const params = new URLSearchParams(searchParams);

      params.set("current", pagination.current);

      params.set("pageSize", pagination.pageSize);

      replace(`${pathname}?${params.toString()}`);
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h2 style={{ margin: 0 }}>Quản lý sản phẩm</h2>

        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          + Thêm sản phẩm
        </Button>
      </div>

      <div>
        <Table
          bordered
          dataSource={products}
          columns={columns}
          rowKey={"_id"}
          scroll={{ x: 1600 }}
          tableLayout="auto"
          style={{
            width: "80vw",
            overflowX: "scroll",
            display: "flex",
          }}
          pagination={{
            current: meta?.current || 1,
            pageSize: meta?.pageSize || 10,
            total: meta?.total || 0,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["10", "20", "50", "100"],

            showTotal: (total, range) => (
              <div>
                {range[0]}-{range[1]} trong tổng {total} sản phẩm
              </div>
            ),
          }}
          onChange={onChange}
        />
      </div>

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
    </>
  );
};

export default ProductTable;
