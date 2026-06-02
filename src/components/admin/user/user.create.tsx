import { handleCreateUserAction } from "@/utils/actions";
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
} from "antd";
import { useState } from "react";

interface IProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (v: boolean) => void;
  accessToken: string;
}

const UserCreate = (props: IProps) => {
  const { isCreateModalOpen, setIsCreateModalOpen, accessToken } = props;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleCloseCreateModal = () => {
    form.resetFields();
    setImageFile(null);
    setIsCreateModalOpen(false);
  };

  const onFinish = async (values: any) => {
    setLoading(true);

    try {
      console.log("FORM VALUES:", values);

      console.log("IMAGE FILE:", imageFile);

      let imageUrl = "";

      if (imageFile) {
        const uploadRes = await uploadUserImage(imageFile, accessToken);

        imageUrl = uploadRes?.data?.image || "";
      }

      const payload = {
        ...values,
        image: imageUrl,
      };
      console.log("PAYLOAD:", payload);

      const res = await handleCreateUserAction(payload);

      console.log("CREATE RESPONSE:", res);

      if (res?.data) {
        handleCloseCreateModal();

        message.success("Tạo người dùng thành công!");

        window.location.reload();
      } else {
        console.error("CREATE FAILED:", res);

        notification.error({
          message: "Lỗi tạo người dùng",
          description: res?.message || "Có lỗi xảy ra",
        });
      }
    } catch (error: any) {
      console.error("CREATE ERROR:", error);

      console.error("ERROR RESPONSE:", error?.response);

      console.error("ERROR DATA:", error?.response?.data);

      notification.error({
        message: "Lỗi tạo người dùng",
        description:
          error?.response?.data?.message || error?.message || "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Thêm người dùng mới"
      open={isCreateModalOpen}
      onCancel={() => handleCloseCreateModal()}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={() => handleCloseCreateModal()}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={() => form.submit()}
        >
          Thêm
        </Button>,
      ]}
    >
      <Form name="basic" onFinish={onFinish} layout="vertical" form={form}>
        <Row gutter={[15, 15]}>
          <Col span={24}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Vui lòng nhập email!" },
                { type: "email", message: "Email không hợp lệ!" },
                { max: 255, message: "Email tối đa 255 ký tự" },
              ]}
            >
              <Input type="email" placeholder="example@email.com" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Mật khẩu"
              name="password"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu!" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                { max: 255, message: "Mật khẩu tối đa 255 ký tự" },
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Tên người dùng"
              name="name"
              rules={[
                { required: true, message: "Vui lòng nhập tên!" },
                { min: 2, message: "Tên tối thiểu 2 ký tự" },
                { max: 255, message: "Tên tối đa 255 ký tự" },
              ]}
            >
              <Input placeholder="Nhập tên" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item
              label="Số điện thoại"
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
          <Col span={24}>
            <Form.Item label="Ảnh đại diện">
              <Input
                type="file"
                accept="image/*"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setImageFile(file);
                }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default UserCreate;
