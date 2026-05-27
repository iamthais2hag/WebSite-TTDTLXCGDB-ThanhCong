import carVideo from "../assets/car.mp4";
import { CONSULT_PHONE } from "../siteConfig";

const heroBadges = [
  "Khai giảng liên tục",
  "Tư vấn rõ ràng",
  "Học thực hành bài bản",
] as const;

const trustBadges = [
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
  const phoneHref = `tel:${CONSULT_PHONE.replace(/\s/g, "")}`;

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
        <div className="hero-banner__actions" aria-label="Lối tắt nội dung chính">
          <a className="button-link button-link--primary" href="#tuyen-sinh">
            Xem khóa học
          </a>
          <a className="button-link" href={phoneHref}>
            Gọi {CONSULT_PHONE}
          </a>
        </div>
        <div className="hero-banner__badges" aria-label="Điểm nổi bật">
          {heroBadges.map((badge) => (
            <span key={badge}>{badge}</span>
          ))}
        </div>
      </div>

      <div className="hero-banner__media" aria-hidden="true">
        <div className="hero-card">
          <div className="hero-card__stripe" />
          <div className="hero-card__inner">
            <div className="hero-card__stage">
              <div className="hero-card__shadow" />
              <video
                autoPlay
                className="hero-banner__mascot"
                loop
                muted
                playsInline
                preload="metadata"
                src={carVideo}
              />
              <span className="hero-card__floating hero-card__floating--start">
                <strong>Khai giảng</strong>
                <small>Liên tục</small>
              </span>
              <span className="hero-card__floating hero-card__floating--end">
                <strong>Tư vấn</strong>
                <small>Rõ ràng</small>
              </span>
            </div>

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
      </div>
    </section>
  );
}
