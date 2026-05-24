export function LookupPage() {
  return (
    <section className="page-section" id="tra-cuu" aria-labelledby="lookup-title">
      <div className="section-heading">
        <p className="section-eyebrow">Tra cứu học viên</p>
        <h2 id="lookup-title">Khu vực tra cứu thông tin đăng ký học</h2>
        <p>
          Form tra cứu CCCD và loại đào tạo sẽ được kết nối với tRPC ở bước
          triển khai riêng. Giai đoạn này chỉ chuẩn bị vị trí hiển thị.
        </p>
      </div>

      <div className="lookup-placeholder" aria-label="Khung form tra cứu chưa kết nối API">
        <div>
          <span className="placeholder-label">CCCD</span>
          <span className="placeholder-input">Nhập số CCCD</span>
        </div>
        <div>
          <span className="placeholder-label">Loại đào tạo</span>
          <span className="placeholder-input">Mô tô / Ô tô</span>
        </div>
        <button className="button-link button-link--primary" type="button" disabled>
          Tra cứu
        </button>
      </div>
    </section>
  );
}
