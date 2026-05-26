import carVideo from "../assets/car.mp4";

const heroBadges = ["Khai giảng liên tục", "Tư vấn rõ ràng"] as const;
const trustBadges = ["Uy tín", "Tận tâm", "Bài bản"] as const;

export function HomePage() {
  return (
    <section className="hero-banner" id="trang-chu" aria-labelledby="home-title">
      <div className="hero-banner__content">
        <p className="hero-banner__eyebrow">Website chính thức</p>
        <h1 id="home-title">
          Trung tâm Đào tạo Lái xe <span>Thành Công</span>
        </h1>
        <p className="hero-banner__slogan">
          Vững tay lái, an toàn mọi hành trình
        </p>
        <p className="hero-banner__lead">
          Kênh thông tin chính thống về đào tạo lái xe, tra cứu học viên,
          thông báo và văn bản pháp lý của Trung tâm.
        </p>
        <div className="hero-banner__badges" aria-label="Điểm nổi bật">
          {heroBadges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
        <div className="hero-banner__actions" aria-label="Lối tắt nội dung chính">
          <a className="button-link button-link--primary" href="#tra-cuu">
            Tra cứu học viên
          </a>
          <a className="button-link" href="#thong-bao">
            Xem thông báo
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
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
