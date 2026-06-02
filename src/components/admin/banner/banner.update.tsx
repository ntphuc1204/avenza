"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  Select,
  Upload,
  message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { bannerApi } from "@/utils/banner.api";
import { uploadMediaImages } from "@/utils/upload";

interface IBanner {
  _id: string;
  title: string;
  description?: string;
  imageUrl: string;
  link?: string;
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  location: string;
  type: string;
}

interface IBannerUpdateProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  data: IBanner | null;
  accessToken: string;
  onSuccess: () => void;
}

const BannerUpdate = ({
  isModalOpen,
  setIsModalOpen,
  data,
  accessToken,
  onSuccess,
}: IBannerUpdateProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(data?.imageUrl || "");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (data && isModalOpen) {
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        link: data.link,
        displayOrder: data.displayOrder,
        isActive: data.isActive,
        startDate: data.startDate ? dayjs(data.startDate) : null,
        endDate: data.endDate ? dayjs(data.endDate) : null,
        location: data.location,
        type: data.type,
      });
      setImageUrl(data.imageUrl);
      setImageFile(null);
    }
  }, [data, isModalOpen, form]);

  const handleUpload = (file: File) => {
    setImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImageUrl(previewUrl);
    form.setFieldValue("imageUrl", previewUrl);
    return false;
  };

  const isErrorResponse = (res: any) => res && Number(res.statusCode) >= 400;

  const onFinish = async (values: any) => {
    try {
      if (!data?._id) return;

      setLoading(true);

      let imageUrlValue = values.imageUrl || "";

      if (imageFile) {
        const uploadRes = await uploadMediaImages([imageFile], accessToken);
        console.log("[BannerUpdate] upload response:", uploadRes);
        imageUrlValue = Array.isArray(uploadRes)
          ? uploadRes[0]?.url || imageUrlValue
          : uploadRes?.data?.[0]?.url || imageUrlValue;
      }

      const updateData = {
        title: values.title,
        description: values.description,
        imageUrl: imageUrlValue,
        link: values.link,
        displayOrder: values.displayOrder || 0,
        isActive: values.isActive ?? true,
        startDate: values.startDate ? values.startDate.toDate() : undefined,
        endDate: values.endDate ? values.endDate.toDate() : undefined,
        location: values.location,
        type: values.type,
      };

      const res = await bannerApi.update(data._id, updateData, accessToken);

      if (isErrorResponse(res)) {
        message.error(res.message || "Cập nhật banner thất bại");
        return;
      }

      message.success("Cập nhật banner thành công");
      setIsModalOpen(false);
      setImageFile(null);
      onSuccess();
    } catch (error) {
      message.error("Lỗi cập nhật banner");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Cập nhật Banner"
      open={isModalOpen}
      onCancel={() => {
        setIsModalOpen(false);
        setImageFile(null);
      }}
      onOk={() => form.submit()}
      confirmLoading={loading}
      width={700}
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[
            { required: true, message: "Vui lòng nhập tiêu đề" },
            { min: 3, message: "Tiêu đề tối thiểu 3 ký tự" },
            { max: 255, message: "Tiêu đề tối đa 255 ký tự" },
          ]}
        >
          <Input placeholder="Nhập tiêu đề banner" />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ max: 1000, message: "Mô tả tối đa 1000 ký tự" }]}
        >
          <Input.TextArea rows={2} placeholder="Mô tả banner (tùy chọn)" />
        </Form.Item>

        <Form.Item
          label="URL Hình ảnh"
          name="imageUrl"
          rules={[
            { required: true, message: "Vui lòng cung cấp URL hình ảnh" },
            { type: "url", message: "URL hình ảnh không hợp lệ" },
          ]}
        >
          <Input placeholder="https://example.com/image.jpg" />
        </Form.Item>

        <Form.Item label="Hoặc tải lên hình ảnh mới">
          <Upload.Dragger
            accept="image/*"
            multiple={false}
            beforeUpload={handleUpload}
            maxCount={1}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Nhấn hoặc kéo hình ảnh vào đây</p>
          </Upload.Dragger>
          {imageUrl && (
            <div style={{ marginTop: 10 }}>
              <img
                src={imageUrl}
                alt="preview"
                style={{ maxWidth: "100%", maxHeight: 200 }}
              />
            </div>
          )}
        </Form.Item>

        <Form.Item label="Liên kết (Link)" name="link">
          <Input placeholder="/promotions/may-2024" />
        </Form.Item>

        <Form.Item label="Thứ tự hiển thị" name="displayOrder">
          <InputNumber min={0} />
        </Form.Item>

        <Form.Item label="Vị trí" name="location">
          <Select>
            <Select.Option value="HOMEPAGE">Trang chủ</Select.Option>
            <Select.Option value="SIDEBAR">Thanh bên</Select.Option>
            <Select.Option value="FOOTER">Footer</Select.Option>
            <Select.Option value="POPUP">Popup</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Loại" name="type">
          <Select>
            <Select.Option value="BANNER">Banner</Select.Option>
            <Select.Option value="PROMOTION">Khuyến mãi</Select.Option>
            <Select.Option value="ANNOUNCEMENT">Thông báo</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Ngày bắt đầu" name="startDate">
          <DatePicker showTime placeholder="Chọn ngày giờ" />
        </Form.Item>

        <Form.Item label="Ngày kết thúc" name="endDate">
          <DatePicker showTime placeholder="Chọn ngày giờ" />
        </Form.Item>

        <Form.Item label="Hoạt động" name="isActive" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BannerUpdate;
