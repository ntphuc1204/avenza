"use client";

import {
  Button,
  Card,
  Input,
  Space,
  Typography,
  Tabs,
  List,
  Avatar,
  Spin,
  message,
} from "antd";
import { useEffect, useState } from "react";

const { Title } = Typography;

const AiPanel = ({ accessToken }: { accessToken?: string }) => {
  const [chatMessage, setChatMessage] = useState("");
  const [recommendText, setRecommendText] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    if (!accessToken) return;

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/history`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    const data = await res.json();
    setHistory(data?.data || []);
  };

  useEffect(() => {
    fetchHistory();
  }, [accessToken]);

  // ================= CHAT =================
  const handleChat = async () => {
    setLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/chat`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: chatMessage }),
      },
    );

    const data = await res.json();

    setLoading(false);

    if (data?.data) {
      setResponse(data.data);
      message.success("OK");
      fetchHistory();
    }
  };

  // ================= RECOMMEND =================
  const handleRecommend = async () => {
    setLoading(true);

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/ai/recommend`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ context: recommendText }),
      },
    );

    const data = await res.json();

    setLoading(false);
    setResponse(data?.data);
  };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto" }}>
      <Title level={3}>🤖 AI Admin Panel</Title>

      <Tabs
        items={[
          {
            key: "chat",
            label: "Chat AI",
            children: (
              <Card>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Input.TextArea
                    rows={3}
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <Button type="primary" loading={loading} onClick={handleChat}>
                    Gửi
                  </Button>

                  {response && (
                    <Card>
                      <pre>{JSON.stringify(response, null, 2)}</pre>
                    </Card>
                  )}
                </Space>
              </Card>
            ),
          },
          {
            key: "recommend",
            label: "Gợi ý",
            children: (
              <Card>
                <Input.TextArea
                  rows={3}
                  value={recommendText}
                  onChange={(e) => setRecommendText(e.target.value)}
                />
                <Button style={{ marginTop: 10 }} onClick={handleRecommend}>
                  Tạo gợi ý
                </Button>
              </Card>
            ),
          },
          {
            key: "history",
            label: "History",
            children: (
              <Card>
                {loading ? (
                  <Spin />
                ) : (
                  <List
                    dataSource={history}
                    renderItem={(item, i) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar>{i + 1}</Avatar>}
                          title={`Chat #${i + 1}`}
                          description={
                            <pre style={{ whiteSpace: "pre-wrap" }}>
                              {JSON.stringify(item, null, 2)}
                            </pre>
                          }
                        />
                      </List.Item>
                    )}
                  />
                )}
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
};

export default AiPanel;
