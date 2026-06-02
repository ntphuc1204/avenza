import { handleUpdateUserAction } from "@/utils/actions";
import { uploadUserImage } from "@/utils/upload";

import {
  Modal,
  Input,
  Form,
  Row,
  Col,
  message,
  notification,
  Button,
  Switch,
} from "antd";

import { useEffect, useState } from "react";

interface IProps {
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (v: boolean) => void;
  dataUpdate: any;
  setDataUpdate: any;
  accessToken: string;
}

const UserUpdate = (props: IProps) => {
  const {
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    dataUpdate,
    setDataUpdate,
    accessToken,
  } = props;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (dataUpdate) {
      form.setFieldsValue({
        name: dataUpdate.name,
        email: dataUpdate.email,
        phone: dataUpdate.phone,
        address: dataUpdate.address,
        isActive: dataUpdate.isActive,
      });

      setImageFile(null);
    }
  }, [dataUpdate, form]);

  const handleCloseUpdateModal = () => {
    form.resetFields();
    setIsUpdateModalOpen(false);
    setDataUpdate(null);
    setImageFile(null);
  };

  const onFinish = async (values: any) => {
    if (!dataUpdate) return;

    setLoading(true);

    try {
      console.log("FORM VALUES:", values);
      console.log("IMAGE FILE:", imageFile);

      // ===== 1. UPLOAD IMAGE FIRST =====
      let imageUrl = dataUpdate.image || "";

      if (imageFile) {
        const uploadRes = await uploadUserImage(imageFile, accessToken);

        console.log("UPLOAD RESPONSE:", uploadRes);

        imageUrl = uploadRes?.data?.image || "";
      }

      // ===== 2. SEND ONLY PLAIN OBJECT =====
      const payload = {
        _id: dataUpdate._id,
        name: values.name,
        phone: values.phone,
        address: values.address,
        isActive: values.isActive,
        image: imageUrl,
      };

      console.log("UPDATE PAYLOAD:", payload);

      const res: any = await handleUpdateUserAction(payload);

      console.log("UPDATE RESPONSE:", res);

      if (res?.data) {
        handleCloseUpdateModal();

        message.success("Cập nhật người dùng thành công!");

        window.location.reload();
      } else {
        notification.error({
          message: "Lỗi cập nhật người dùng",
          description: res?.message || "Có lỗi xảy ra",
        });
      }
    } catch (error: any) {
      console.error("UPDATE ERROR:", error);

      notification.error({
        message: "Lỗi cập nhật người dùng",
        description:
          error?.response?.data?.message || error?.message || "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Cập nhật người dùng"
      open={isUpdateModalOpen}
      onCancel={handleCloseUpdateModal}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={handleCloseUpdateModal}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          Cập nhật
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={[15, 15]}>
          <Col span={24} md={12}>
            <Form.Item label="Email" name="email">
              <Input disabled />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Tên người dùng"
              name="name"
              rules={[
                { required: true, message: "Tên người dùng không được trống" },
                { min: 2, message: "Tên tối thiểu 2 ký tự" },
                { max: 255, message: "Tên tối đa 255 ký tự" },
              ]}
            >
              <Input placeholder="Nhập tên" />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Trạng thái"
              name="isActive"
              valuePropName="checked"
            >
              <Switch checkedChildren="Hoạt động" unCheckedChildren="Khoá" />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Điện thoại"
              name="phone"
              rules={[
                {
                  pattern: /^[0-9]{10,11}$/,
                  message: "Số điện thoại phải có 10-11 chữ số",
                },
              ]}
            >
              <Input placeholder="0912345678" />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Địa chỉ"
              name="address"
              rules={[{ max: 500, message: "Địa chỉ tối đa 500 ký tự" }]}
            >
              <Input placeholder="Nhập địa chỉ" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Ảnh đại diện">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default UserUpdate;
