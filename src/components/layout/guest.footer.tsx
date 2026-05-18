const GuestFooter = () => {
  return (
    <footer
      style={{
        width: "100%",
        background: "#111827",
        color: "#ffffff",
        padding: "24px 20px",
        marginTop: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div>
          <h3 style={{ color: "#ffffff", marginBottom: 12 }}>Avenza</h3>
          <p style={{ color: "#d1d5db", maxWidth: 360 }}>
            Nền tảng bán hàng thiết bị giáo dục với trải nghiệm mua sắm nhanh,
            thân thiện và đầy đủ tính năng.
          </p>
        </div>
        <div>
          <h4 style={{ color: "#ffffff", marginBottom: 12 }}>Liên hệ</h4>
          <p style={{ color: "#d1d5db", margin: 0 }}>Email: hello@avenza.vn</p>
          <p style={{ color: "#d1d5db", margin: 0 }}>Hotline: 1900 1000</p>
        </div>
      </div>
    </footer>
  );
};

export default GuestFooter;
