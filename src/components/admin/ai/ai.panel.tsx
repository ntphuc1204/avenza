"use client";

import { Button, Card, Divider, Form, Input, message, Space, Spin, Typography } from "antd";
import { useEffect, useState } from "react";
import { sendRequest } from "@/utils/api";

interface IProps {
  accessToken?: string;
}

const AiPanel = ({ accessToken }: IProps) => {
  const [chatMessage, setChatMessage] = useState("");
  const [recommendText, setRecommendText] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/history`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (res?.data) {
        setHistory(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [accessToken]);

  const handleChat = async () => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");
      return;
    }
    if (!chatMessage.trim()) {
      message.warn("Nhập nội dung chat");
      return;
    }

    setLoading(true);
    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/chat`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          message: chatMessage,
        },
      });
      if (res?.data) {
        setResponse(res.data);
        message.success("AI đã trả lời");
        fetchHistory();
      } else {
        message.error(res?.message || "Gọi AI thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi gọi AI");
    } finally {
      setLoading(false);
    }
  };

  const handleRecommend = async () => {
    if (!accessToken) {
      message.error("Không tìm thấy quyền truy cập");
      return;
    }
    setLoading(true);
    try {
      const res = await sendRequest<IBackendRes<any>>({
        url: `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/recommend`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: {
          context: recommendText,
        },
      });
      if (res?.data) {
        setResponse(res.data);
        message.success("AI đã tạo gợi ý sản phẩm");
        fetchHistory();
      } else {
        message.error(res?.message || "Gọi AI thất bại");
      }
    } catch (error) {
      message.error("Lỗi khi gọi AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography.Title level={3}>AI Console</Typography.Title>
      <Space direction="vertical" style={{ width: "100%" }} size={24}>
        <Card title="Chat AI" type="inner">
          <Form layout="vertical" onFinish={handleChat}>
            <Form.Item label="Nội dung chat">
              <Input.TextArea
                rows={4}
                value={chatMessage}
                onChange={(event) => setChatMessage(event.target.value)}
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleChat} loading={loading}>
                Gửi Chat
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Gợi ý sản phẩm" type="inner">
          <Form layout="vertical" onFinish={handleRecommend}>
            <Form.Item label="Ngữ cảnh gợi ý">
              <Input.TextArea
                rows={4}
                value={recommendText}
                onChange={(event) => setRecommendText(event.target.value)}
                placeholder="Nhập yêu cầu hoặc bối cảnh để AI gợi ý sản phẩm"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" onClick={handleRecommend} loading={loading}>
                Gợi ý sản phẩm
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Card title="Kết quả AI" type="inner">
          {loading ? (
            <Spin />
          ) : response ? (
            <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {JSON.stringify(response, null, 2)}
            </pre>
          ) : (
            <Typography.Text>Chưa có kết quả AI</Typography.Text>
          )}
        </Card>

        <Card title="Lịch sử AI" type="inner">
          <Divider />
          {history.length === 0 ? (
            <Typography.Text>Không có lịch sử.</Typography.Text>
          ) : (
            history.map((item, index) => (
              <div key={index} style={{ marginBottom: 12 }}>
                <Typography.Text strong>{index + 1}. </Typography.Text>
                <Typography.Paragraph style={{ margin: 0 }}>
                  {JSON.stringify(item)}
                </Typography.Paragraph>
              </div>
            ))
          )}
        </Card>
      </Space>
    </div>
  );
};

export default AiPanel;
