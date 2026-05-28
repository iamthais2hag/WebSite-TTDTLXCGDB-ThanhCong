const overviewStats = [
  {
    icon: "graduation",
    value: "Toàn Bộ",
    label: "Các hạng đào tạo",
    description: "Mô tô, ô tô và nâng hạng giấy phép lái xe.",
  },
  {
    icon: "users",
    value: "5000+",
    label: "Học viên/năm",
    description:
      "Tuyển sinh thường xuyên, đồng hành cùng học viên trong suốt quá trình học và sát hạch.",
  },
  {
    icon: "car",
    value: "Xe Tập Lái",
    label: "Hiện Đại",
    description: "Đáp ứng nhu cầu khai giảng liên tục, hỗ trợ học thực hành hiệu quả.",
  },
  {
    icon: "award",
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

type OverviewIconName = (typeof overviewStats)[number]["icon"];

function OverviewIcon({ name }: { name: OverviewIconName }) {
  if (name === "graduation") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="m3 9 9-4 9 4-9 4-9-4Z" />
        <path d="m7 11.5v4c1.6 1 3.2 1.5 5 1.5s3.4-.5 5-1.5v-4" />
        <path d="M21 9v5" />
      </svg>
    );
  }

  if (name === "users") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M16 19v-1.5c0-1.9-1.6-3.5-3.5-3.5h-5C5.6 14 4 15.6 4 17.5V19" />
        <path d="M9.5 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M20 19v-1.4c0-1.5-.9-2.8-2.3-3.3" />
        <path d="M16.5 4.7a3 3 0 0 1 0 5.8" />
      </svg>
    );
  }

  if (name === "car") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M5 16h14" />
        <path d="m6.5 16 1.4-4.1A3 3 0 0 1 10.7 10h2.6a3 3 0 0 1 2.8 1.9l1.4 4.1" />
        <path d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path d="M12 4 8.8 8.4 3.6 10l3.3 4.2-.1 5.4 5.2-1.9 5.2 1.9-.1-5.4 3.3-4.2-5.2-1.6L12 4Z" />
      <path d="M9.8 13.1 11.2 14.5 14.4 11.2" />
    </svg>
  );
}

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
        {overviewStats.map((item) => (
          <article className="overview-stat-card" key={item.value}>
            <span className="overview-card__icon">
              <OverviewIcon name={item.icon} />
            </span>
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
