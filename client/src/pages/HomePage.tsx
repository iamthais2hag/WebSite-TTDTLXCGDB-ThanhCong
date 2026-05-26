import carVideo from "../assets/car.mp4";

const heroBadges = [
  "Khai giảng liên tục",
  "Tư vấn rõ ràng",
  "Học thực hành bài bản",
] as const;

const trustBadges = [
  {
    label: "Khai giảng",
    value: "Liên tục",
  },
  {
    label: "Tư vấn",
    value: "Rõ ràng",
  },
  {
    label: "Uy tín",
    value: "Thông tin rõ ràng",
  },
  {
    label: "Tận tâm",
    value: "Đồng hành học viên",
  },
  {
    label: "Bài bản",
    value: "Học đúng chuẩn",
  },
] as const;

export function HomePage() {
  return (
    <section className="hero-banner" id="trang-chu" aria-labelledby="home-title">
      <div className="hero-banner__content">
        <p className="hero-banner__eyebrow">TUYỂN SINH THƯỜNG XUYÊN</p>
        <h1 id="home-title">
          <span>Học lái xe bài bản,</span>
          <span>sát hạch đúng chuẩn</span>
        </h1>
        <p className="hero-banner__lead">
          Đào tạo các hạng mô tô, ô tô và nâng hạng giấy phép lái xe tại khu
          vực Đắk Lắk với quy trình tư vấn rõ ràng, chương trình học bám sát
          quy định và đội ngũ hỗ trợ tận tâm.
        </p>
        <div className="hero-banner__badges" aria-label="Điểm nổi bật">
          {heroBadges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
        <div className="hero-banner__actions" aria-label="Lối tắt nội dung chính">
          <a className="button-link button-link--primary" href="#tuyen-sinh">
            Xem khóa học
          </a>
          <a className="button-link button-link--call" href="tel:0926236239">
            Gọi 0926 236 239
          </a>
        </div>
      </div>

      <div className="hero-banner__media" aria-hidden="true">
        <div className="hero-card">
          <div className="hero-card__shine" />
          <video
            autoPlay
            className="hero-banner__mascot"
            loop
            muted
            playsInline
            preload="metadata"
            src={carVideo}
          />
          <div className="hero-card__badges">
            {trustBadges.map((badge) => (
              <span className="hero-card__badge" key={badge.label}>
                <strong>{badge.label}</strong>
                <small>{badge.value}</small>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
