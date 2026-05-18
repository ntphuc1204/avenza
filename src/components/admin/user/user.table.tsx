"use client";

import { handleDeleteUserAction } from "@/utils/actions";
import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";
import { Button, Popconfirm, Table, message } from "antd";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import UserCreate from "./user.create";
import UserUpdate from "./user.update";

interface IUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  accountType: string;
  isActive: boolean;
  phone?: string;
  address?: string;
  image?: string;
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
    results: IUser[];
  };
}

const UserTable = (props: IProps) => {
  const { data } = props;

  const users = data?.results || [];

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

  const [dataUpdate, setDataUpdate] = useState<IUser | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const columns = [
    {
      title: "STT",
      width: 60,
      fixed: "left" as const,
      render: (_: any, record: IUser, index: number) => {
        return <>{index + 1 + (meta.current - 1) * meta.pageSize}</>;
      },
    },
    {
      title: "Ảnh",
      dataIndex: "image",
      width: 100,
      render: (image: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";
        const placeholderSrc =
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect width='48' height='48' fill='%23f0f2f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999' font-size='10'%3EUSER%3C/text%3E%3C/svg%3E";
        const src = image
          ? image.startsWith("http")
            ? image
            : `${baseUrl}${image}`
          : placeholderSrc;

        return (
          <img
            src={src}
            alt="avatar"
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
      title: "ID",
      dataIndex: "_id",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Email",
      dataIndex: "email",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Tên",
      dataIndex: "name",
      width: 180,
      ellipsis: true,
    },
    {
      title: "Điện thoại",
      dataIndex: "phone",
      width: 140,
      ellipsis: true,
      responsive: ["md"] as any,
    },
    {
      title: "Địa chỉ",
      dataIndex: "address",
      width: 260,
      ellipsis: true,
      responsive: ["lg"] as any,
    },
    {
      title: "Vai trò",
      dataIndex: "role",
      width: 120,
      ellipsis: true,
    },
    {
      title: "Loại tài khoản",
      dataIndex: "accountType",
      width: 140,
      ellipsis: true,
      responsive: ["lg"] as any,
    },
    {
      title: "Trạng thái",
      render: (_: any, record: IUser) => {
        return (
          <span
            style={{
              color: record.isActive ? "#52c41a" : "#ff4d4f",
              fontWeight: "bold",
            }}
          >
            {record.isActive ? "✓ Hoạt động" : "✗ Không hoạt động"}
          </span>
        );
      },
      width: 120,
    },
    {
      title: "Hành động",
      fixed: "right" as const,
      width: 120,
      render: (_: any, record: IUser) => {
        return (
          <div style={{ display: "flex", gap: "10px" }}>
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
              title="Xác nhận xóa người dùng"
              description="Bạn có chắc chắn muốn xóa người dùng này không?"
              onConfirm={async () => {
                setDeletingId(record._id);
                try {
                  const res = await handleDeleteUserAction(record?._id);
                  if (res?.data) {
                    message.success("Xóa người dùng thành công!");
                    window.location.reload();
                  } else {
                    message.error(res?.message || "Lỗi khi xóa người dùng");
                  }
                } catch (error) {
                  message.error("Lỗi khi xóa người dùng");
                } finally {
                  setDeletingId(null);
                }
              }}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <span style={{ cursor: "pointer" }}>
                <DeleteTwoTone
                  twoToneColor="#ff4d4f"
                  style={{ fontSize: "16px" }}
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
        <h2 style={{ margin: 0 }}>Quản lý người dùng</h2>

        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          + Thêm người dùng
        </Button>
      </div>

      <div style={{ width: "100%", overflowX: "auto" }}>
        <Table
          bordered
          dataSource={users}
          columns={columns}
          rowKey={"_id"}
          scroll={{ x: 1200 }}
          tableLayout="fixed"
          style={{
            width: "85vw",
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
                {range[0]}-{range[1]} trong tổng {total} người dùng
              </div>
            ),
          }}
          onChange={onChange}
          loading={false}
        />
      </div>

      <UserCreate
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
      />

      <UserUpdate
        isUpdateModalOpen={isUpdateModalOpen}
        setIsUpdateModalOpen={setIsUpdateModalOpen}
        dataUpdate={dataUpdate}
        setDataUpdate={setDataUpdate}
      />
    </>
  );
};

export default UserTable;
