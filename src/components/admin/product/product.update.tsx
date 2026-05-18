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
} from "antd";
import { useEffect, useState } from "react";

const { TextArea } = Input;

interface IProps {
  isUpdateModalOpen: boolean;
  setIsUpdateModalOpen: (v: boolean) => void;
  dataUpdate: any;
  setDataUpdate: any;
  categories?: any[];
}

const ProductUpdate = (props: IProps) => {
  const {
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    dataUpdate,
    setDataUpdate,
    categories = [],
  } = props;

  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

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
    }
  }, [dataUpdate, form]);

  const handleCloseUpdateModal = () => {
    form.resetFields();
    setIsUpdateModalOpen(false);
    setDataUpdate(null);
  };

  const onFinish = async (values: any) => {
    if (dataUpdate) {
      setLoading(true);

      try {
        const payload = {
          _id: dataUpdate._id,
          name: values.name,
          slug: values.slug,
          description: values.description,
          price: values.price,
          stock: values.stock,
          categoryId: values.categoryId,
          isFeatured: values.isFeatured,
          status: values.status,
        };

        const res = await handleUpdateProductAction(payload);

        if (res?.data) {
          handleCloseUpdateModal();

          message.success("Cập nhật sản phẩm thành công!");

          window.location.reload();
        } else {
          notification.error({
            message: "Lỗi cập nhật sản phẩm",
            description: res?.message || "Có lỗi xảy ra",
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
    }
  };

  return (
    <Modal
      title="Cập nhật sản phẩm"
      open={isUpdateModalOpen}
      onCancel={() => handleCloseUpdateModal()}
      maskClosable={false}
      width={800}
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
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
      >
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
            <Form.Item
              label="Slug"
              name="slug"
            >
              <Input placeholder="Nhập slug" />
            </Form.Item>
          </Col>

          <Col span={24}>
            <Form.Item
              label="Mô tả"
              name="description"
            >
              <TextArea
                rows={4}
                placeholder="Nhập mô tả sản phẩm"
              />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item
              label="Giá"
              name="price"
              rules={[
                {
                  required: true,
                  message: "Vui lòng nhập giá!",
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
            <Form.Item
              label="Trạng thái"
              name="status"
            >
              <Select
                placeholder="Chọn trạng thái"
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
        </Row>
      </Form>
    </Modal>
  );
};

export default ProductUpdate;