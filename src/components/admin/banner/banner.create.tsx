"use client";

import { useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Switch,
  Select,
  Button,
  Upload,
  message,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { bannerApi } from "@/utils/banner.api";
import { uploadMediaImages } from "@/utils/upload";

interface IBannerCreateProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  accessToken: string;
  onSuccess: () => void;
}

const BannerCreate = ({
  isModalOpen,
  setIsModalOpen,
  accessToken,
  onSuccess,
}: IBannerCreateProps) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

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
      setLoading(true);

      let imageUrlValue = values.imageUrl || "";

      if (imageFile) {
        const uploadRes = await uploadMediaImages([imageFile], accessToken);
        console.log("[BannerCreate] upload response:", uploadRes);
        imageUrlValue = Array.isArray(uploadRes)
          ? uploadRes[0]?.url || imageUrlValue
          : uploadRes?.data?.[0]?.url || imageUrlValue;
      }

      const data = {
        title: values.title,
        description: values.description,
        imageUrl: imageUrlValue,
        link: values.link,
        displayOrder: values.displayOrder || 0,
        isActive: values.isActive ?? true,
        startDate: values.startDate ? values.startDate.toDate() : undefined,
        endDate: values.endDate ? values.endDate.toDate() : undefined,
        location: values.location || "HOMEPAGE",
        type: values.type || "BANNER",
      };

      console.log("[BannerCreate] create payload:", data, {
        accessToken: accessToken ? "***" : "(no token)",
      });

      const res = await bannerApi.create(data, accessToken);

      console.log("[BannerCreate] create response:", res);

      if (isErrorResponse(res)) {
        message.error(res.message || "Tạo banner thất bại");
        return;
      }

      message.success("Tạo banner thành công");
      form.resetFields();
      setImageUrl("");
      setImageFile(null);
      setIsModalOpen(false);
      onSuccess();
    } catch (error) {
      message.error("Lỗi tạo banner");
      console.error("[BannerCreate] create error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Tạo Banner"
      open={isModalOpen}
      onCancel={() => {
        setIsModalOpen(false);
        form.resetFields();
        setImageUrl("");
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

        <Form.Item label="Hoặc tải lên hình ảnh">
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
          <InputNumber min={0} placeholder="0" />
        </Form.Item>

        <Form.Item label="Vị trí" name="location" initialValue="HOMEPAGE">
          <Select>
            <Select.Option value="HOMEPAGE">Trang chủ</Select.Option>
            <Select.Option value="SIDEBAR">Thanh bên</Select.Option>
            <Select.Option value="FOOTER">Footer</Select.Option>
            <Select.Option value="POPUP">Popup</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Loại" name="type" initialValue="BANNER">
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

        <Form.Item
          label="Hoạt động"
          name="isActive"
          valuePropName="checked"
          initialValue={true}
        >
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BannerCreate;
