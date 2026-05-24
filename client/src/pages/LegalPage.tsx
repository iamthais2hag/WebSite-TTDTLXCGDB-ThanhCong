const legalDocuments = [
  "Quy định đào tạo lái xe cơ giới đường bộ",
  "Quy định sát hạch và cấp giấy phép lái xe",
  "Biểu mẫu, hướng dẫn hồ sơ học viên",
] as const;

export function LegalPage() {
  return (
    <section className="page-section" id="phap-ly" aria-labelledby="legal-title">
      <div className="section-heading">
        <p className="section-eyebrow">Pháp lý</p>
        <h2 id="legal-title">Văn bản và hướng dẫn liên quan</h2>
        <p>
          Khu vực tổng hợp văn bản pháp luật, quy định và hướng dẫn cần thiết
          cho học viên.
        </p>
      </div>

      <div className="list-panel" aria-label="Danh sách văn bản mẫu">
        {legalDocuments.map((item) => (
          <article className="list-row" key={item}>
            <span className="list-row__marker" aria-hidden="true" />
            <h3>{item}</h3>
            <p>Chỗ hiển thị đường dẫn hoặc nội dung văn bản.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
