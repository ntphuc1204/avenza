"use client";

import GuestHeader from "./guest.header";
import GuestFooter from "./guest.footer";

const GuestLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <GuestHeader />
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>
        {children}
      </main>
      <GuestFooter />
    </div>
  );
};

export default GuestLayout;
