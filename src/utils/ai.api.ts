const getBaseUrl = () => {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL || "";
  if (/^https?:\/\//i.test(raw) || raw.startsWith("/")) return raw;
  return `http://${raw}`;
};

export interface AiChatMeta {
  intent?: string;
  confidence?: number;
  products?: any[];
  orders?: any[];
  vouchers?: any[];
  cart?: any;
  action?: { type: string; success: boolean; message: string };
  recommendations?: any[];
}

export interface AiStreamResult {
  text: string;
  meta: AiChatMeta;
  error?: string;
}

export const fetchAiHistory = async (accessToken: string) => {
  const res = await fetch(`${getBaseUrl()}/api/v1/ai/history`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || "Không tải được lịch sử chat");
  }
  return json?.data || [];
};

export const sendAiChat = async (
  accessToken: string,
  message: string,
): Promise<{ message: string } & AiChatMeta> => {
  const res = await fetch(`${getBaseUrl()}/api/v1/ai/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || "Gửi tin nhắn thất bại");
  }
  return json?.data || { message: "" };
};

export const fetchAiRecommend = async (
  accessToken: string,
  context?: string,
) => {
  const res = await fetch(`${getBaseUrl()}/api/v1/ai/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ context: context || "" }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json?.message || "Gợi ý thất bại");
  }
  return json?.data;
};

export const streamAiChat = async (
  accessToken: string,
  message: string,
  handlers: {
    onMeta?: (meta: AiChatMeta) => void;
    onChunk?: (chunk: string, fullText: string) => void;
    onError?: (error: string) => void;
    onDone?: (result: AiStreamResult) => void;
  },
): Promise<AiStreamResult> => {
  const res = await fetch(`${getBaseUrl()}/api/v1/ai/chat-stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message }),
  });

  const contentType = res.headers.get("content-type") || "";

  if (!res.ok || !contentType.includes("text/event-stream")) {
    const json = await res.json().catch(() => ({}));
    const errMsg =
      json?.message || json?.error?.message || `Lỗi server (${res.status})`;
    handlers.onError?.(errMsg);
    throw new Error(errMsg);
  }

  if (!res.body) {
    throw new Error("Không nhận được stream từ server");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let fullText = "";
  let meta: AiChatMeta = {};
  let error: string | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;

      const payload = trimmed.replace(/^data:\s*/, "").trim();
      if (!payload) continue;

      if (payload === "[DONE]") {
        const result = { text: fullText, meta, error };
        handlers.onDone?.(result);
        return result;
      }

      try {
        const parsed = JSON.parse(payload);

        if (parsed.type === "error" || parsed.error) {
          error = parsed.message || "AI Error";
          handlers.onError?.(error || "AI Error");
          continue;
        }

        if (parsed.type === "meta") {
          meta = {
            intent: parsed.intent,
            confidence: parsed.confidence,
            products: parsed.products,
            orders: parsed.orders,
            vouchers: parsed.vouchers,
            cart: parsed.cart,
            action: parsed.action,
            recommendations: parsed.recommendations,
          };
          handlers.onMeta?.(meta);
          continue;
        }

        if (parsed.type === "content" && parsed.content) {
          fullText += parsed.content;
          handlers.onChunk?.(parsed.content, fullText);
        } else if (parsed.content) {
          fullText += parsed.content;
          handlers.onChunk?.(parsed.content, fullText);
        }
      } catch {
        // ignore malformed chunk
      }
    }
  }

  const result = { text: fullText, meta, error };
  handlers.onDone?.(result);
  return result;
};
