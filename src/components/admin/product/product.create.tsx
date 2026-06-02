"use client";

import { handleCreateProductAction } from "@/utils/actions";
import { uploadProductImages } from "@/utils/upload";

import {
  Modal,
  Input,
  Form,
  Row,
  Col,
  InputNumber,
  Select,
  Switch,
  message,
  notification,
  Button,
  Upload,
  Image,
} from "antd";

import { UploadOutlined } from "@ant-design/icons";

import { useState } from "react";

const { TextArea } = Input;

interface IProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (v: boolean) => void;
  categories?: any[];
  suppliers?: any[];
  accessToken: string;
}

const ProductCreate = (props: IProps) => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    categories = [],
    suppliers = [],
    accessToken,
  } = props;

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  // upload files
  const [imageFiles, setImageFiles] = useState<any[]>([]);

  // =========================
  // CLOSE MODAL
  // =========================
  const handleCloseCreateModal = () => {
    form.resetFields();

    setImageFiles([]);

    setIsCreateModalOpen(false);
  };

  // =========================
  // SUBMIT
  // =========================
  const onFinish = async (values: any) => {
    setLoading(true);

    try {
      // lấy file thật từ antd upload
      const files = imageFiles
        .map((f: any) => f.originFileObj)
        .filter(Boolean) as File[];

      let imageUrl = "";

      // =========================
      // UPLOAD IMAGE
      // =========================
      if (files.length > 0) {
        const uploadRes = await uploadProductImages(files, accessToken);

        console.log("UPLOAD RESPONSE:", uploadRes);

        // response array
        if (Array.isArray(uploadRes)) {
          imageUrl = uploadRes[0]?.url || "";
        }

        // response có data
        if (uploadRes?.data) {
          imageUrl = uploadRes.data[0]?.url || "";
        }
      }

      // =========================
      // PAYLOAD
      // =========================
      const payload = {
        name: values.name,

        slug: values.slug,

        description: values.description,

        price: Number(values.price),

        categoryId: values.categoryId,

        supplierId: values.supplierId,

        status: values.status,

        isFeatured: !!values.isFeatured,

        images: imageUrl ? [imageUrl] : [],
      };

      console.log("CREATE PAYLOAD:", payload);

      // =========================
      // CREATE PRODUCT
      // =========================
      const res = await handleCreateProductAction(payload);

      console.log("CREATE RESPONSE:", res);

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
      console.log(error);

      notification.error({
        message: "Lỗi tạo sản phẩm",
        description:
          error?.response?.data?.message || error?.message || "Có lỗi xảy ra",
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
          {/* NAME */}
          <Col span={24} md={12}>
            <Form.Item
              label="Tên sản phẩm"
              name="name"
              rules={[
                { required: true, message: "Vui lòng nhập tên sản phẩm" },
                { min: 3, message: "Tên sản phẩm tối thiểu 3 ký tự" },
                { max: 255, message: "Tên sản phẩm tối đa 255 ký tự" },
              ]}
            >
              <Input placeholder="Nhập tên sản phẩm" />
            </Form.Item>
          </Col>

          {/* SLUG */}
          <Col span={24} md={12}>
            <Form.Item
              label="Slug"
              name="slug"
              rules={[
                { min: 3, message: "Slug tối thiểu 3 ký tự" },
                { max: 255, message: "Slug tối đa 255 ký tự" },
                {
                  pattern: /^[a-z0-9-]+$/,
                  message: "Slug chỉ chứa chữ cái thường, số và dấu gạch ngang",
                },
              ]}
            >
              <Input placeholder="slug-san-pham" />
            </Form.Item>
          </Col>

          {/* DESCRIPTION */}
          <Col span={24}>
            <Form.Item
              label="Mô tả"
              name="description"
              rules={[{ max: 2000, message: "Mô tả tối đa 2000 ký tự" }]}
            >
              <TextArea rows={4} placeholder="Mô tả sản phẩm..." />
            </Form.Item>
          </Col>

          {/* PRICE */}
          <Col span={24} md={12}>
            <Form.Item
              label="Giá"
              name="price"
              rules={[
                { required: true, message: "Vui lòng nhập giá" },
                {
                  validator: (_, value) => {
                    if (!value || value > 0) return Promise.resolve();
                    return Promise.reject(new Error("Giá phải lớn hơn 0"));
                  },
                },
                {
                  validator: (_, value) => {
                    if (!value || value <= 999999999) return Promise.resolve();
                    return Promise.reject(
                      new Error("Giá không được vượt quá 999,999,999"),
                    );
                  },
                },
              ]}
            >
              <InputNumber style={{ width: "100%" }} min={0} placeholder="0" />
            </Form.Item>
          </Col>

          {/* CATEGORY */}
          <Col span={24} md={12}>
            <Form.Item
              label="Danh mục"
              name="categoryId"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn danh mục",
                },
              ]}
            >
              <Select
                placeholder="Chọn danh mục"
                options={categories.map((c) => ({
                  label: c.name,
                  value: c._id,
                }))}
              />
            </Form.Item>
          </Col>

          {/* SUPPLIER */}
          <Col span={24} md={12}>
            <Form.Item
              label="Nhà cung cấp"
              name="supplierId"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn nhà cung cấp",
                },
              ]}
            >
              <Select
                placeholder="Chọn nhà cung cấp"
                options={suppliers.map((s) => ({
                  label: s.name,
                  value: s._id,
                }))}
              />
            </Form.Item>
          </Col>

          {/* STATUS */}
          <Col span={24} md={12}>
            <Form.Item label="Trạng thái" name="status" initialValue="ACTIVE">
              <Select
                options={[
                  {
                    label: "Hoạt động",
                    value: "ACTIVE",
                  },
                  {
                    label: "Ẩn",
                    value: "INACTIVE",
                  },
                ]}
              />
            </Form.Item>
          </Col>

          {/* FEATURED */}
          <Col span={24}>
            <Form.Item
              label="Nổi bật"
              name="isFeatured"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          {/* PREVIEW IMAGE */}
          {imageFiles.length > 0 && (
            <Col span={24}>
              <Image
                src={URL.createObjectURL(imageFiles[0].originFileObj)}
                width={120}
                height={120}
                style={{
                  objectFit: "cover",
                  borderRadius: 8,
                  border: "1px solid #eee",
                }}
              />
            </Col>
          )}

          {/* UPLOAD */}
          <Col span={24}>
            <Form.Item label="Hình ảnh">
              <Upload
                listType="picture"
                maxCount={1}
                beforeUpload={() => false}
                fileList={imageFiles}
                onChange={({ fileList }) => {
                  setImageFiles(fileList);
                }}
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
