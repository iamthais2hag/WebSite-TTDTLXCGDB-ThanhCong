const overviewStats = [
  {
    value: "Toàn Bộ",
    label: "Các hạng đào tạo",
    description: "Mô tô, ô tô và nâng hạng giấy phép lái xe.",
  },
  {
    value: "5000+",
    label: "Học viên/năm",
    description:
      "Tuyển sinh thường xuyên, đồng hành cùng học viên trong suốt quá trình học và sát hạch.",
  },
  {
    value: "Xe Tập Lái",
    label: "Hiện Đại",
    description: "Đáp ứng nhu cầu khai giảng liên tục, hỗ trợ học thực hành hiệu quả.",
  },
  {
    value: "Đội Ngũ Giáo Viên",
    label: "Chuyên Nghiệp",
    description: "Bài bản, tận tâm và luôn hỗ trợ học viên trong từng giai đoạn đào tạo.",
  },
] as const;

const overviewItems = [
  {
    title: "Thông tin chính thống",
    description:
      "Kênh công bố nội dung đào tạo, thông báo và văn bản liên quan của Trung tâm.",
  },
  {
    title: "Tư vấn rõ ràng",
    description:
      "Học viên được định hướng hạng đào tạo, hồ sơ và lộ trình học phù hợp.",
  },
  {
    title: "Đào tạo bài bản",
    description:
      "Chương trình học bám sát quy định, kết hợp lý thuyết và thực hành an toàn.",
  },
  {
    title: "Đồng hành học viên",
    description:
      "Hỗ trợ tra cứu, cập nhật thông tin và chuẩn bị các bước cần thiết trong quá trình học.",
  },
] as const;

export function CenterOverviewPage() {
  return (
    <section className="page-section overview-section" id="gioi-thieu" aria-labelledby="overview-title">
      <div className="section-heading section-heading--center">
        <p className="section-eyebrow">Giới thiệu trung tâm</p>
        <h2 id="overview-title">Vững tay lái, vững bước trên mỗi hành trình</h2>
        <p>
          Trung tâm Đào tạo Lái xe Cơ giới Đường bộ Thành Công xây dựng môi
          trường học tập rõ ràng, thuận tiện và bám sát quy định, giúp học viên
          yên tâm từ khi chuẩn bị hồ sơ đến khi tham gia sát hạch.
        </p>
      </div>

      <div className="overview-stats-grid" aria-label="Năng lực đào tạo của Trung tâm">
        {overviewStats.map((item, index) => (
          <article className="overview-stat-card" key={item.value}>
            <span className="overview-card__number">{String(index + 1).padStart(2, "0")}</span>
            <h3>{item.value}</h3>
            <p className="overview-stat-card__label">{item.label}</p>
            <p>{item.description}</p>
          </article>
        ))}
      </div>

      <div className="overview-grid overview-grid--features" aria-label="Điểm nổi bật của Trung tâm">
        {overviewItems.map((item, index) => (
          <article className="overview-card" key={item.title}>
            <span className="overview-card__number">{String(index + 1).padStart(2, "0")}</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
