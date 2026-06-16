"use client";

import { Button, Form, Input, message, Modal, Popconfirm, Tag } from "antd";

import { DeleteTwoTone, EditTwoTone } from "@ant-design/icons";

import { useState } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { sendRequest } from "@/utils/api";

interface ISupplier {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status?: "ACTIVE" | "INACTIVE";
  productCount?: number;
  createdAt?: string;
}

interface IProps {
  suppliers: ISupplier[];
  accessToken?: string;
}

const SupplierTable = ({ suppliers, accessToken }: IProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingSupplier, setEditingSupplier] = useState<ISupplier | null>(
    null,
  );

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers/${id}`,

        method: "DELETE",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data) {
        message.success("Xoa vinh vien nha cung cap thanh cong");

        refresh();
      } else {
        message.error(res?.message || "Xoa nha cung cap that bai");
      }
    } catch (error) {
      message.error("Loi khi xoa nha cung cap");
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
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers/${id}/${action}`,

        method: "PATCH",

        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (res?.data) {
        message.success(
          action === "activate"
            ? "Kich hoat nha cung cap thanh cong"
            : "Ngung hoat dong nha cung cap thanh cong",
        );

        refresh();
      } else {
        message.error(res?.message || "Thao tac that bai");
      }
    } catch (error) {
      message.error("Loi khi cap nhat trang thai nha cung cap");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSave = async (values: any) => {
    if (!accessToken) {
      message.error("Khong tim thay quyen truy cap");

      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        name: values.name?.trim(),
        email: values.email?.trim(),
        phone: values.phone?.trim(),
        address: values.address?.trim(),
      };
      let res = null;

      if (editingSupplier) {
        res = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers/${editingSupplier._id}`,

          method: "PATCH",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          body: payload,
        });
      } else {
        res = await sendRequest<IBackendRes<any>>({
          url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/suppliers`,

          method: "POST",

          headers: {
            Authorization: `Bearer ${accessToken}`,
          },

          body: payload,
        });
      }

      if (res?.data) {
        message.success(
          editingSupplier
            ? "Cap nhat nha cung cap thanh cong"
            : "Tao nha cung cap thanh cong",
        );

        setIsModalOpen(false);

        setEditingSupplier(null);

        form.resetFields();

        refresh();
      } else {
        message.error(res?.message || "Thao tac that bai");
      }
    } catch (error) {
      message.error("Loi khi luu nha cung cap");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set("search", value.trim());
    } else {
      params.delete("search");
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h2 className="page-title">Quan ly nha cung cap</h2>

        <div className="page-actions">
          <Input.Search
            placeholder="Tim theo ten, email, SDT, dia chi"
            allowClear
            enterButton="Tim"
            value={searchText}
            style={{ width: 300, marginRight: 8 }}
            onChange={(e) => setSearchText(e.target.value)}
            onSearch={handleSearch}
          />
          <Button
            type="primary"
            onClick={() => {
              setEditingSupplier(null);

              form.resetFields();

              setIsModalOpen(true);
            }}
          >
            + Them nha cung cap
          </Button>
        </div>
      </div>

      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ten</th>
              <th>Email</th>
              <th>Dien thoai</th>
              <th>Dia chi</th>
              <th>Trang thai</th>
              <th>So san pham</th>
              <th>Thoi gian tao</th>
              <th className="sticky-column">Hanh dong</th>
            </tr>
          </thead>

          <tbody>
            {suppliers.map((item) => {
              const productCount = item.productCount ?? 0;
              const isInactive = item.status === "INACTIVE";
              const statusAction = isInactive ? "activate" : "deactivate";

              return (
                <tr key={item._id}>
                  <td>
                    <div className="table-name">{item.name}</div>
                  </td>

                  <td>{item.email || "-"}</td>

                  <td>{item.phone || "-"}</td>

                  <td>
                    <div className="table-subtext">{item.address || "-"}</div>
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
                          setEditingSupplier(item);
                          setIsModalOpen(true);
                          form.setFieldsValue({
                            name: item.name,
                            email: item.email,
                            phone: item.phone,
                            address: item.address,
                          });
                        }}
                      />

                      <Popconfirm
                        title={
                          isInactive
                            ? "Kich hoat nha cung cap?"
                            : "Ngung hoat dong nha cung cap?"
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
                        title="Xoa vinh vien nha cung cap?"
                        description={
                          productCount > 0
                            ? "Chi xoa duoc khi nha cung cap khong con san pham."
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

      <Modal
        title={editingSupplier ? "Cap nhat nha cung cap" : "Tao nha cung cap"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        okText="Luu"
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Ten nha cung cap"
            rules={[
              { required: true, message: "Ten nha cung cap khong duoc trong" },
              { min: 3, message: "Ten toi thieu 3 ky tu" },
              { max: 255, message: "Ten toi da 255 ky tu" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: "email", message: "Email khong hop le" },
              { max: 255, message: "Email toi da 255 ky tu" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Dien thoai"
            rules={[
              {
                pattern: /^[0-9]{10,11}$/,
                message: "So dien thoai phai co 10-11 chu so",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Dia chi"
            rules={[{ max: 500, message: "Dia chi toi da 500 ky tu" }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SupplierTable;
