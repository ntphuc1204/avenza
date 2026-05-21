"use client";

import { Layout } from "antd";

const AdminContent = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  const { Content } = Layout;

  return (
    <Content
      style={{
        position: "relative",
        overflow: "hidden",
        minHeight: "calc(100vh - 64px)",
        background: "#ffffff",
      }}
    >
      {/* BACKGROUND GRID */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,

          backgroundImage: `
            linear-gradient(
              to right,
              rgba(16,185,129,0.18) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(16,185,129,0.18) 1px,
              transparent 1px
            )
          `,

          backgroundSize: "32px 32px",

          WebkitMaskImage:
            "radial-gradient(ellipse 70% 70% at 50% 50%, #000 40%, transparent 100%)",

          maskImage:
            "radial-gradient(ellipse 70% 70% at 50% 50%, #000 40%, transparent 100%)",
        }}
      />

      {/* CONTENT */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          padding: 24,
          minHeight: "calc(100vh - 180px)",
        }}
      >
        {children}
      </div>
    </Content>
  );
};

export default AdminContent;
