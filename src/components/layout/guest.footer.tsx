import Link from "next/link";
import {
  FacebookFilled,
  InstagramFilled,
  MailFilled,
  PhoneFilled,
} from "@ant-design/icons";

const GuestFooter = () => {
  return (
    <footer
      style={{
        width: "100%",
        background: "#111827",
        color: "#ffffff",
        marginTop: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          padding: "50px 20px 30px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32,
          }}
        >
          <div>
            <h2
              style={{
                color: "#ffffff",
                marginBottom: 16,
                fontSize: 28,
                fontWeight: 800,
              }}
            >
              AVENZA
            </h2>

            <p
              style={{
                color: "#d1d5db",
                lineHeight: 1.8,
                marginBottom: 20,
              }}
            >
              Nền tảng bán thiết bị giáo dục hiện đại với trải nghiệm mua sắm
              nhanh chóng, thông minh và thân thiện.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                fontSize: 22,
              }}
            >
              <FacebookFilled />
              <InstagramFilled />
            </div>
          </div>

          <div>
            <h3
              style={{
                color: "#ffffff",
                marginBottom: 18,
              }}
            >
              Điều hướng
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <Link
                href="/"
                style={{
                  color: "#d1d5db",
                }}
              >
                Trang chủ
              </Link>

              <Link
                href="/cart"
                style={{
                  color: "#d1d5db",
                }}
              >
                Giỏ hàng
              </Link>

              <Link
                href="/orders"
                style={{
                  color: "#d1d5db",
                }}
              >
                Đơn hàng
              </Link>

              <Link
                href="/ai"
                style={{
                  color: "#d1d5db",
                }}
              >
                Trợ lý AI
              </Link>
            </div>
          </div>

          <div>
            <h3
              style={{
                color: "#ffffff",
                marginBottom: 18,
              }}
            >
              Liên hệ
            </h3>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                color: "#d1d5db",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <MailFilled />
                hello@avenza.vn
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <PhoneFilled />
                1900 1000
              </div>
            </div>
          </div>

          <div>
            <h3
              style={{
                color: "#ffffff",
                marginBottom: 18,
              }}
            >
              Hỗ trợ khách hàng
            </h3>

            <p
              style={{
                color: "#d1d5db",
                lineHeight: 1.8,
              }}
            >
              Hỗ trợ tư vấn sản phẩm, xử lý đơn hàng và thanh toán trực tuyến
              24/7.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: 40,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: 20,
            textAlign: "center",
            color: "#9ca3af",
            fontSize: 14,
          }}
        >
          © 2026 AVENZA. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default GuestFooter;
