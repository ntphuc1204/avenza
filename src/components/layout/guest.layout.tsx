"use client";

import GuestHeader from "./guest.header";
import GuestFooter from "./guest.footer";

const GuestLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",
        color: "#111827",

        // màu chủ đạo
        background: "#f8f8f8",
      }}
    >
      {/* DIAGONAL GRID BACKGROUND */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",

          backgroundImage: `
            repeating-linear-gradient(
              45deg,
              rgba(0,0,0,0.04) 0,
              rgba(0,0,0,0.04) 1px,
              transparent 1px,
              transparent 20px
            ),

            repeating-linear-gradient(
              -45deg,
              rgba(0,0,0,0.04) 0,
              rgba(0,0,0,0.04) 1px,
              transparent 1px,
              transparent 20px
            )
          `,

          backgroundSize: "40px 40px",
        }}
      />

      {/* LIGHT GLOW */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.7)",
          filter: "blur(100px)",
          zIndex: 0,
        }}
      />

      {/* CONTENT */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <GuestHeader />

        <main
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "24px 20px",
          }}
        >
          {children}
        </main>

        <GuestFooter />
      </div>
    </div>
  );
};

export default GuestLayout;
