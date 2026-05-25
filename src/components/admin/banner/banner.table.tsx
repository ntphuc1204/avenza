"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Pagination,
  Popconfirm,
  Table,
  message,
  Image,
  Tag,
  Space,
} from "antd";
import { DeleteTwoTone, EditTwoTone, PlusOutlined } from "@ant-design/icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BannerCreate from "./banner.create";
import BannerUpdate from "./banner.update";
import { bannerApi } from "@/utils/banner.api";
import dayjs from "dayjs";

interface IBanner {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  location: string;
  type: string;
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
    meta?: IMeta;
    results?: IBanner[];
  };
  accessToken: string;
}

const BannerTable = ({ data, accessToken }: IProps) => {
  const normalizeImageUrl = (url: string) => {
    if (!url) return url;
    if (/^https?:\/\//i.test(url) || /^blob:\/\//i.test(url)) return url;
    if (url.startsWith("/")) {
      return `${process.env.NEXT_PUBLIC_BACKEND_URL}${url}`;
    }
    return `${process.env.NEXT_PUBLIC_BACKEND_URL}/uploads/media/${url}`;
  };
  const [banners, setBanners] = useState<IBanner[]>(data?.results || []);
  const [meta, setMeta] = useState<IMeta>(data?.meta || {
    current: 1,
    pageSize: 10,
    pages: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [dataUpdate, setDataUpdate] = useState<IBanner | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBanners = async (page = meta.current) => {
    setLoading(true);

    try {
      const res = await bannerApi.getAll(page, meta.pageSize);
      const results = Array.isArray(res?.data) ? res.data : res?.data?.results || [];

      setBanners(results);
      setMeta((prev) => ({
        ...prev,
        current: page,
        total: results.length,
        pages: Math.max(1, Math.ceil(results.length / prev.pageSize)),
      }));
    } catch (error) {
      console.error("[BannerTable] fetchBanners error:", error);
    } finally {
      setLoading(false);
    }
  };

  const isErrorResponse = (res: any) =>
    res && Number(res.statusCode) >= 400;

  const handleDeleteBanner = async (id: string) => {
    try {
      setDeletingId(id);
      const res = await bannerApi.delete(id, accessToken);

      if (isErrorResponse(res)) {
        message.error(res.message || "Xóa banner thất bại");
        return;
      }

      message.success("Xóa banner thành công");
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      message.error("Lỗi xóa banner");
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: "STT",
      dataIndex: "index",
      render: (_: any, __: any, index: number) =>
        (meta.current - 1) * meta.pageSize + index + 1,
      width: 50,
    },
    {
      title: "Hình ảnh",
      dataIndex: "imageUrl",
      render: (imageUrl: string) => (
        <Image
          src={normalizeImageUrl(imageUrl)}
          alt="banner"
          width={80}
          height={60}
          style={{ objectFit: "cover" }}
        />
      ),
      width: 100,
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      width: 150,
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      render: (location: string) => (
        <Tag color="blue">{location}</Tag>
      ),
      width: 100,
    },
    {
      title: "Loại",
      dataIndex: "type",
      render: (type: string) => {
        let color = "default";
        if (type === "PROMOTION") color = "green";
        if (type === "ANNOUNCEMENT") color = "orange";
        return <Tag color={color}>{type}</Tag>;
      },
      width: 100,
    },
    {
      title: "Thứ tự",
      dataIndex: "displayOrder",
      width: 80,
    },
    {
      title: "Hoạt động",
      dataIndex: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "green" : "red"}>
          {isActive ? "Có" : "Không"}
        </Tag>
      ),
      width: 80,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      render: (createdAt: string) =>
        dayjs(createdAt).format("DD/MM/YYYY HH:mm"),
      width: 150,
    },
    {
      title: "Hành động",
      fixed: "right",
      width: 100,
      render: (_: any, record: IBanner) => (
        <Space>
          <EditTwoTone
            onClick={() => {
              setDataUpdate(record);
              setIsUpdateModalOpen(true);
            }}
            style={{ cursor: "pointer", fontSize: 18 }}
          />
          <Popconfirm
            placement="topLeft"
            title="Xóa banner"
            description="Bạn chắc chắn muốn xóa banner này?"
            onConfirm={() => handleDeleteBanner(record._id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <DeleteTwoTone
              style={{
                cursor: "pointer",
                fontSize: 18,
                color: deletingId === record._id ? "gray" : "#ff4d4f",
              }}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handlePaginationChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    replace(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    if (refreshKey > 0) {
      fetchBanners();
    }
  }, [refreshKey]);

  useEffect(() => {
    setBanners(data?.results || []);
    setMeta(data?.meta || meta);
  }, [data]);

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Tạo Banner
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={banners.map((banner) => ({
          ...banner,
          key: banner._id,
        }))}
        pagination={false}
        scroll={{ x: 1000 }}
        loading={loading}
      />

      {meta.pages > 1 && (
        <Pagination
          current={meta.current}
          pageSize={meta.pageSize}
          total={meta.total}
          onChange={handlePaginationChange}
          style={{ marginTop: 16, textAlign: "right" }}
        />
      )}

      <BannerCreate
        isModalOpen={isCreateModalOpen}
        setIsModalOpen={setIsCreateModalOpen}
        accessToken={accessToken}
        onSuccess={() => setRefreshKey((prev) => prev + 1)}
      />

      <BannerUpdate
        isModalOpen={isUpdateModalOpen}
        setIsModalOpen={setIsUpdateModalOpen}
        data={dataUpdate}
        accessToken={accessToken}
        onSuccess={() => {
          setRefreshKey((prev) => prev + 1);
          setDataUpdate(null);
        }}
      />
    </>
  );
};

export default BannerTable;
