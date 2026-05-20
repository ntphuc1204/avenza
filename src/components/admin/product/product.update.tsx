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
  Image,
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

  suppliers?: any[];

  accessToken: string;
}

const ProductUpdate = (props: IProps) => {
  const {
    isUpdateModalOpen,
    setIsUpdateModalOpen,
    dataUpdate,
    setDataUpdate,
    categories = [],
    suppliers = [],
    accessToken,
  } = props;

  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);

  // file upload
  const [imageFiles, setImageFiles] = useState<any[]>([]);

  useEffect(() => {
    if (dataUpdate) {
      form.setFieldsValue({
        name: dataUpdate.name,

        slug: dataUpdate.slug,

        description: dataUpdate.description,

        price: dataUpdate.price,

        importPrice: dataUpdate.importPrice,

        categoryId: dataUpdate.categoryId?._id || dataUpdate.categoryId,

        supplierId:
          dataUpdate.supplierId?._id || dataUpdate.supplierId,

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

  // =========================
  // RENDER IMAGE
  // =========================
  const renderImage = (image: any) => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "";

    if (!image) return "/images/no-image.png";

    // string
    if (typeof image === "string") {
      return image.startsWith("http") ? image : `${baseUrl}${image}`;
    }

    // object
    if (typeof image === "object" && image?.url) {
      return image.url.startsWith("http")
        ? image.url
        : `${baseUrl}${image.url}`;
    }

    return "/images/no-image.png";
  };

  const onFinish = async (values: any) => {
    if (!dataUpdate) return;

    setLoading(true);

    try {
      // =========================
      // GET FILES
      // =========================
      const files = imageFiles
        .map((f: any) => f.originFileObj || f)
        .filter(Boolean) as File[];

      let imageUrl = dataUpdate.images || "";

      // =========================
      // UPLOAD NEW IMAGE
      // =========================
      if (files.length > 0) {
        const uploadRes = await uploadProductImages(files, accessToken);

        console.log("UPLOAD RES:", uploadRes);

        // hỗ trợ nhiều dạng response
        if (Array.isArray(uploadRes) && uploadRes.length > 0) {
          imageUrl = uploadRes[0]?.url || "";
        } else if (uploadRes?.data?.length > 0) {
          imageUrl = uploadRes.data[0]?.url || "";
        }
      }

      // =========================
      // UPDATE PAYLOAD
      // =========================
      const payload = {
        _id: dataUpdate._id,

        name: values.name,

        slug: values.slug,

        description: values.description,

        price: Number(values.price),

        importPrice:
          values.importPrice !== undefined && values.importPrice !== null
            ? Number(values.importPrice)
            : undefined,

        categoryId: values.categoryId,

        supplierId: values.supplierId,

        isFeatured: !!values.isFeatured,

        status: values.status,

        // backend dùng string
        images: imageUrl ? [imageUrl] : [],
      };

      console.log("UPDATE PAYLOAD:", payload);

      const res = await handleUpdateProductAction(payload);

      console.log("UPDATE RESPONSE:", res);

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
      console.log(error);

      notification.error({
        message: "Lỗi cập nhật sản phẩm",

        description:
          error?.response?.data?.message || error?.message || "Có lỗi xảy ra",
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
          {/* NAME */}
          <Col span={24} md={12}>
            <Form.Item label="Tên sản phẩm" name="name">
              <Input />
            </Form.Item>
          </Col>

          {/* SLUG */}
          <Col span={24} md={12}>
            <Form.Item label="Slug" name="slug">
              <Input />
            </Form.Item>
          </Col>

          {/* DESCRIPTION */}
          <Col span={24}>
            <Form.Item label="Mô tả" name="description">
              <TextArea rows={4} />
            </Form.Item>
          </Col>

          {/* PRICE */}
          <Col span={24} md={12}>
            <Form.Item label="Giá bán" name="price">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          <Col span={24} md={12}>
            <Form.Item label="Giá nhập" name="importPrice">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </Col>

          {/* CATEGORY */}
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

          {/* SUPPLIER */}
          <Col span={24} md={12}>
            <Form.Item label="Nhà cung cấp" name="supplierId">
              <Select
                options={suppliers.map((item) => ({
                  label: item.name,
                  value: item._id,
                }))}
              />
            </Form.Item>
          </Col>

          {/* STOCK READONLY */}
          <Col span={24} md={12}>
            <Form.Item label="Tồn kho hiện tại">
              <InputNumber
                style={{ width: "100%" }}
                value={dataUpdate?.stock ?? 0}
                disabled
              />
            </Form.Item>
          </Col>

          {/* STATUS */}
          <Col span={24} md={12}>
            <Form.Item label="Trạng thái" name="status">
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
              label="Sản phẩm nổi bật"
              name="isFeatured"
              valuePropName="checked"
            >
              <Switch />
            </Form.Item>
          </Col>

          {/* CURRENT IMAGE */}
          <Col span={24}>
            <div style={{ marginBottom: 10 }}>
              <strong>Ảnh hiện tại:</strong>
            </div>

            <Image
              src={renderImage(dataUpdate?.images?.[0])}
              width={120}
              height={120}
              style={{
                objectFit: "cover",
                borderRadius: 8,
                border: "1px solid #eee",
              }}
              fallback="/images/no-image.png"
            />
          </Col>

          {/* UPLOAD IMAGE */}
          <Col span={24}>
            <Form.Item label="Hình ảnh mới">
              <Upload
                beforeUpload={(file) => {
                  setImageFiles([file]);

                  return false;
                }}
                onRemove={() => {
                  setImageFiles([]);
                }}
                fileList={imageFiles}
                maxCount={1}
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
