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

const { TextArea } = Input;

interface IProps {
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (v: boolean) => void;
  categories?: any[];
}

const ProductCreate = (props: IProps) => {
  const { isCreateModalOpen, setIsCreateModalOpen, categories = [] } = props;

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
      const payload = {
        ...values,
        images: imageFiles,
      };

      const res = await handleCreateProductAction(payload);

      if (res?.data) {
        handleCloseCreateModal();

        message.success("Tạo sản phẩm thành công!");

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
      onCancel={() => handleCloseCreateModal()}
      maskClosable={false}
      width={800}
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
      <Form layout="vertical" form={form} onFinish={onFinish}>
        <Row gutter={[15, 15]}>
          <Col span={24} md={12}>
            <Form.Item
              label="Tên sản phẩm"
              name="name"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập tên sản phẩm!",
                },
              ]}
            >
              <Input placeholder="Nhập tên sản phẩm" />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item label="Slug" name="slug">
              <Input placeholder="Nhập slug sản phẩm" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Mô tả" name="description">
              <TextArea rows={4} placeholder="Nhập mô tả sản phẩm" />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Giá"
              name="price"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập giá sản phẩm!",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Nhập giá"
              />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Số lượng"
              name="stock"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập số lượng!",
                },
              ]}
            >
              <InputNumber
                style={{ width: "100%" }}
                min={0}
                placeholder="Nhập số lượng"
              />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Danh mục"
              name="categoryId"
              rules={[
                {
                  required: true,
                  message: "Vui lòng chọn danh mục!",
                },
              ]}
            >
              <Select
                placeholder="Chọn danh mục"
                options={categories.map((item) => ({
                  label: item.name,
                  value: item._id,
                }))}
              />
            </Form.Item>
          </Col>

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

          <Col span={24}>
            <Form.Item
              label="Sản phẩm nổi bật"
              name="isFeatured"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item label="Hình ảnh sản phẩm">
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
