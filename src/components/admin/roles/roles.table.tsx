"use client";

import {
  Button,
  Modal,
  Table,
  Tag,
  Popconfirm,
  Space,
  notification,
} from "antd";
import { useEffect, useState } from "react";
import { rolesApi } from "@/utils/roles.api";
import RoleCreateModal from "./roles.create";
import { useSession } from "next-auth/react";

const RolesTable = () => {
  const { data: session } = useSession();

  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await rolesApi.getAll();
      setRoles(res?.data || res || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const token = session?.user?.access_token;
      if (!token) {
        notification.error({ message: "Bạn chưa đăng nhập" });
        return;
      }
      await rolesApi.remove(id, token);
      notification.success({ message: "Xóa role thành công" });
      fetchRoles();
    } catch (e) {
      notification.error({ message: "Xóa thất bại" });
    }
  };

  const columns = [
    { title: "Tên", dataIndex: "name", key: "name" },
    { title: "Mô tả", dataIndex: "description", key: "description" },
    {
      title: "Quyền",
      dataIndex: "permissions",
      key: "permissions",
      render: (perms: string[]) => (
        <Space>
          {perms?.map((p) => (
            <Tag key={p}>{p}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: any) => (
        <Space>
          <Button
            onClick={() => {
              setEditing(record);
              setShowCreate(true);
            }}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Xác nhận xóa?"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button danger> Xóa </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Button type="primary" onClick={() => setShowCreate(true)}>
          Thêm role
        </Button>
      </div>

      <Table
        rowKey={(r) => r._id}
        dataSource={roles}
        columns={columns}
        loading={loading}
      />

      <RoleCreateModal
        visible={showCreate}
        onClose={() => {
          setShowCreate(false);
          setEditing(null);
          fetchRoles();
        }}
        editing={editing}
      />
    </div>
  );
};

export default RolesTable;
