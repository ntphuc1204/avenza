"use client";

import { Typography } from "antd";
import AiChatPanel from "@/components/ai/ai-chat-panel";

const { Title } = Typography;

const AiPanel = ({ accessToken }: { accessToken?: string }) => {
  if (!accessToken) {
    return <Title level={4}>Không có quyền truy cập AI</Title>;
  }

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        Trợ lý AI Admin
      </Title>
      <AiChatPanel
        accessToken={accessToken}
        title="AI Admin Assistant"
        showSidebar
      />
    </div>
  );
};

export default AiPanel;
