import { handleUpdateProductAction } from "@/utils/actions";
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
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { uploadProductImages } from "@/utils/upload";

const { TextArea } = Input;

interface IProps {
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (v: boolean) => void;
  dataUpdate: any;
  setDataUpdate: any;
  categories?: any[];
  accessToken: string;
}

const ProductUpdate = (props: IProps) => {
  const {
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    dataUpdate,
    setDataUpdate,
    categories = [],
    accessToken,
  } = props;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 👇 thêm state ảnh
  const [imageFiles, setImageFiles] = useState<any[]>([]);

  useEffect(() => {
    if (dataUpdate) {
      form.setFieldsValue({
        name: dataUpdate.name,
        slug: dataUpdate.slug,
        description: dataUpdate.description,
        price: dataUpdate.price,
        stock: dataUpdate.stock,
        categoryId: dataUpdate.categoryId?._id || dataUpdate.categoryId,
        isFeatured: dataUpdate.isFeatured,
        status: dataUpdate.status,
      });

      setImageFiles([]);
    }
  }, [dataUpdate, form]);

  const handleCloseUpdateModal = () => {
    form.resetFields();
    setIsUpdateModalOpen(false);
    setDataUpdate(null);
    setImageFiles([]);
  };

  const onFinish = async (values: any) => {
    if (!dataUpdate) return;

    setLoading(true);

    try {
      const files = imageFiles
        .map((f) => f.originFileObj)
        .filter(Boolean) as File[];

      let imageUrls: string[] = [];

      // 1. upload ảnh nếu có
      if (files.length > 0) {
        const uploadRes = await uploadProductImages(files, accessToken);
        imageUrls = uploadRes?.map((i: any) => i.url) || [];
      }

      // 2. payload update
      const payload = {
        _id: dataUpdate._id,
        name: values.name,
        slug: values.slug,
        description: values.description,
        price: Number(values.price),
        stock: Number(values.stock),
        categoryId: values.categoryId,
        isFeatured: values.isFeatured,
        status: values.status,

        // 👇 backend expects string[]
        ...(imageUrls.length > 0 && {
          images: imageUrls,
        }),
      };

      const res = await handleUpdateProductAction(payload);

      if (res?.data) {
        message.success("Cập nhật sản phẩm thành công!");
        handleCloseUpdateModal();
        window.location.reload();
      } else {
        notification.error({
          message: "Lỗi cập nhật sản phẩm",
          description: (res as any)?.message || "Có lỗi xảy ra",
        });
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi cập nhật sản phẩm",
        description: error?.message || "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Cập nhật sản phẩm"
      open={isUpdateModalOpen}
      onCancel={handleCloseUpdateModal}
      maskClosable={false}
      width={800}
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
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={[15, 15]}>
          <Col span={24} md={12}>
            <Form.Item label="Tên sản phẩm" name="name">
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
            <Form.Item label="Giá" name="price">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item label="Số lượng" name="stock">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item label="Danh mục" name="categoryId">
              <Select
                options={categories.map((item) => ({
                  label: item.name,
                  value: item._id,
                }))}
              />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item label="Trạng thái" name="status">
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
              label="Sản phẩm nổi bật"
              name="isFeatured"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          {/* 🔥 UPLOAD ẢNH */}
          <Col span={24}>
            <Form.Item label="Hình ảnh mới">
              <Upload
                multiple
                beforeUpload={(file) => {
                  setImageFiles((prev) => [...prev, file]);
                  return false;
                }}
                onRemove={(file) => {
                  setImageFiles((prev) =>
                    prev.filter((item) => item.uid !== file.uid),
                  );
                }}
                fileList={imageFiles}
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

export default ProductUpdate;
