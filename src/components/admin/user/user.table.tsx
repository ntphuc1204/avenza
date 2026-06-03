"use client";

import { useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";

import { Button, Input, Pagination, Popconfirm, Space, message } from "antd";

import UserCreate from "./user.create";
import UserUpdate from "./user.update";

import { handleDeleteUserAction } from "@/utils/actions";

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

  accessToken: string;
}

const UserTable = ({ data, accessToken }: IProps) => {
  const users = data?.results || [];

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

  const [dataUpdate, setDataUpdate] = useState<IUser | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState(
    searchParams.get("search") ?? "",
  );

  const renderImage = (image?: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    return image
      ? image.startsWith("http")
        ? image
        : `${baseUrl}${image}`
      : "/no-img.jpg";
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      const res = await handleDeleteUserAction(id);

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
      {/* HEADER */}

      <div className="page-header">
        <h2 className="page-title">Quản lý người dùng</h2>

        <div className="page-actions">
          <Space.Compact>
            <Input.Search
              placeholder="Tìm theo tên, email, SĐT, vai trò"
              allowClear
              enterButton="Tìm"
              value={searchText}
              style={{ width: 320 }}
              onChange={(e) => setSearchText(e.target.value)}
              onSearch={handleSearch}
            />
            <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
              + Thêm người dùng
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

              <th>Tên</th>

              <th>Email</th>

              <th>Điện thoại</th>

              <th>Vai trò</th>

              <th>Loại TK</th>

              <th>Trạng thái</th>

              <th className="sticky-column">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {users.map((item) => (
              <tr key={item._id}>
                <td>
                  <img
                    src={renderImage(item.image)}
                    alt={item.name}
                    className="table-image"
                  />
                </td>

                <td>
                  <div className="table-name">{item.name}</div>

                  <div className="table-subtext">{item.address || "-"}</div>
                </td>

                <td>{item.email}</td>

                <td>{item.phone || "-"}</td>

                <td>{item.role}</td>

                <td>{item.accountType}</td>

                <td>
                  <span
                    className={`status-badge ${
                      item.isActive ? "status-active" : "status-inactive"
                    }`}
                  >
                    {item.isActive ? "Hoạt động" : "Khóa"}
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
                      title="Xóa người dùng?"
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
            `${range[0]}-${range[1]} trong tổng ${total} người dùng`
          }
        />
      </div>

      {/* MODALS */}

      <UserCreate
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        accessToken={accessToken}
      />

      <UserUpdate
        isUpdateModalOpen={isUpdateModalOpen}
        setIsUpdateModalOpen={setIsUpdateModalOpen}
        dataUpdate={dataUpdate}
        setDataUpdate={setDataUpdate}
        accessToken={accessToken}
      />
    </div>
  );
};

export default UserTable;
