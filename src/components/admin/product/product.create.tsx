"use client";

import { handleCreateProductAction } from "@/utils/actions";
import type { UploadFile } from "antd/es/upload/interface";
import {
  Modal,
  Input,
  Form,
  Row,
  Col,
  InputNumber,
  Select,
  Switch,
  Upload,
  message,
  notification,
  Button,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { uploadProductImages } from "@/utils/upload";

const { TextArea } = Input;

interface IProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (v: boolean) => void;
  categories?: any[];
  accessToken: string;
}

const ProductCreate = (props: IProps) => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    categories = [],
    accessToken,
  } = props;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<UploadFile[]>([]);

  const handleCloseCreateModal = () => {
    form.resetFields();
    setImageFiles([]);
    setIsCreateModalOpen(false);
  };

  const onFinish = async (values: any) => {
    setLoading(true);

    try {
      const files = imageFiles
        .map((f) => f.originFileObj)
        .filter(Boolean) as File[];

      let imageUrls: string[] = [];

      // 1. UPLOAD IMAGES TRƯỚC
      if (files.length > 0) {
        const uploadRes = await uploadProductImages(files, accessToken);
        imageUrls = uploadRes?.map((i: any) => i.url) || [];
      }

      // 2. CREATE PRODUCT
      const payload = {
        name: values.name,
        slug: values.slug,
        description: values.description,
        price: Number(values.price),
        stock: Number(values.stock),
        categoryId: values.categoryId,
        status: values.status,
        isFeatured: !!values.isFeatured,
        images: imageUrls, // 👈 backend cần string[]
      };

      const res = await handleCreateProductAction(payload);

      if (res?.data) {
        message.success("Tạo sản phẩm thành công!");
        handleCloseCreateModal();
        window.location.reload();
      } else {
        notification.error({
          message: "Lỗi tạo sản phẩm",
          description: res?.message || "Có lỗi xảy ra",
        });
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi tạo sản phẩm",
        description: error?.message || "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Thêm sản phẩm mới"
      open={isCreateModalOpen}
      onCancel={handleCloseCreateModal}
      maskClosable={false}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCloseCreateModal}>
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
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={[15, 15]}>
          <Col span={24} md={12}>
            <Form.Item
              label="Tên sản phẩm"
              name="name"
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item label="Slug" name="slug">
              <Input />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Mô tả" name="description">
              <TextArea rows={4} />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item label="Giá" name="price" rules={[{ required: true }]}>
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Số lượng"
              name="stock"
              rules={[{ required: true }]}
            >
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Danh mục"
              name="categoryId"
              rules={[{ required: true }]}
            >
              <Select
                options={categories.map((c) => ({
                  label: c.name,
                  value: c._id,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item label="Trạng thái" name="status" initialValue="ACTIVE">
              <Select
                options={[
                  { label: "Hoạt động", value: "ACTIVE" },
                  { label: "Ẩn", value: "INACTIVE" },
                ]}
              />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Nổi bật"
              name="isFeatured"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Hình ảnh">
              <Upload
                multiple
                beforeUpload={(file) => {
                  setImageFiles((prev) => [...prev, file]);
                  return false;
                }}
                onRemove={(file) => {
                  setImageFiles((prev) =>
                    prev.filter((f) => f.uid !== file.uid),
                  );
                }}
                fileList={imageFiles as any}
              >
                <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default ProductCreate;
