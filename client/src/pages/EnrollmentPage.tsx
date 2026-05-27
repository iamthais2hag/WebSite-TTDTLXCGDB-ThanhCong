import a1Image from "../assets/a1.png";
import amImage from "../assets/am.png";
import bImage from "../assets/b.png";
import cImage from "../assets/c.png";
import c1Image from "../assets/c1.png";
import nhImage from "../assets/nh.png";

const trainingGroups = [
  {
    image: a1Image,
    name: "A1",
    summary: "Đào tạo mô tô hạng A1 theo chương trình được công bố.",
    meta: "Mô tô",
  },
  {
    image: amImage,
    name: "A/AM",
    summary: "Nhóm đào tạo mô tô A/AM theo dữ liệu đã xác nhận.",
    meta: "Mô tô",
  },
  {
    image: bImage,
    name: "B số sàn/số cơ khí/số tự động",
    summary: "Đào tạo ô tô hạng B với các nhu cầu sử dụng xe phổ biến.",
    meta: "Ô tô",
  },
  {
    image: c1Image,
    name: "C1",
    summary: "Đào tạo ô tô tải hạng C1 theo quy định hiện hành.",
    meta: "Ô tô tải",
  },
  {
    image: cImage,
    name: "C",
    summary: "Đào tạo ô tô tải hạng C cho nhu cầu vận tải chuyên nghiệp.",
    meta: "Ô tô tải",
  },
  {
    image: nhImage,
    name: "Nâng hạng",
    summary: "Tư vấn và đào tạo nâng hạng theo điều kiện từng hồ sơ.",
    meta: "GPLX",
  },
] as const;

export function EnrollmentPage() {
  return (
    <section className="page-section page-section--band enrollment-section" id="tuyen-sinh" aria-labelledby="enrollment-title">
      <div className="section-hero">
        <div className="section-hero__inner">
          <p className="section-eyebrow">Tuyển sinh</p>
          <h2 id="enrollment-title">Các nhóm đào tạo</h2>
          <p>
            Thông tin tuyển sinh được đặt sau các phần thông tin chính thống của
            Trung tâm, dùng đúng bộ ảnh xe chính thức đã được xác nhận.
          </p>
        </div>
      </div>

      <div className="section-body">
        <div className="training-grid" aria-label="Danh sách nhóm đào tạo">
          {trainingGroups.map((group) => (
            <article className="training-card" key={group.name}>
              <div className="training-card__media">
                <img src={group.image} alt="" />
              </div>
              <span className="training-card__badge">Hạng {group.name}</span>
              <h3>{group.name}</h3>
              <p>{group.summary}</p>
              <div className="training-card__meta">
                <span>Nhóm</span>
                <strong>{group.meta}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
