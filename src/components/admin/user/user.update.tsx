import { handleUpdateUserAction } from "@/utils/actions";
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
import { useEffect, useState } from "react";

interface IProps {
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (v: boolean) => void;
  dataUpdate: any;
  setDataUpdate: any;
}

const UserUpdate = (props: IProps) => {
  const { isUpdateModalOpen, setIsUpdateModalOpen, dataUpdate, setDataUpdate } =
    props;

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
    if (dataUpdate) {
      setLoading(true);
      try {
        const payload = {
          _id: dataUpdate._id,
          name: values.name,
          phone: values.phone,
          address: values.address,
          image: imageFile ?? undefined,
        };
        const res = await handleUpdateUserAction(payload);
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
        notification.error({
          message: "Lỗi cập nhật người dùng",
          description: error?.message || "Có lỗi xảy ra",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Modal
      title="Cập nhật người dùng"
      open={isUpdateModalOpen}
      onCancel={() => handleCloseUpdateModal()}
      maskClosable={false}
      footer={[
        <Button key="cancel" onClick={() => handleCloseUpdateModal()}>
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
      <Form name="basic" onFinish={onFinish} layout="vertical" form={form}>
        <Row gutter={[15, 15]}>
          <Col span={24} md={12}>
            <Form.Item label="Email" name="email">
              <Input type="email" disabled />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Tên người dùng"
              name="name"
              rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
            >
              <Input placeholder="Nhập tên" />
            </Form.Item>
          </Col>
          <Col span={24} md={12}>
            <Form.Item label="Điện thoại" name="phone">
              <Input placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item label="Địa chỉ" name="address">
              <Input placeholder="Nhập địa chỉ" />
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

export default UserUpdate;
