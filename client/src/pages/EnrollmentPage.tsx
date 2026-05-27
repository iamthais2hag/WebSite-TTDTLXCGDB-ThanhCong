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
    title: "Mô tô hạng A1",
    summary:
      "Đào tạo lái xe mô tô hai bánh dung tích đến 125cc hoặc xe điện có công suất theo quy định hiện hành.",
    duration: "1-2 tháng",
  },
  {
    image: amImage,
    name: "A/AM",
    title: "Mô tô hạng A/AM",
    summary: "Đào tạo nhóm mô tô A/AM theo chương trình và phạm vi hạng đã được công bố.",
    duration: "1-2 tháng",
  },
  {
    image: bImage,
    name: "B số sàn/số cơ khí/số tự động",
    title: "Ô tô hạng B",
    summary:
      "Đào tạo hạng B số sàn, số cơ khí và số tự động, phù hợp nhu cầu sử dụng xe phổ biến.",
    duration: "3-5 tháng",
  },
  {
    image: c1Image,
    name: "C1",
    title: "Ô tô tải hạng C1",
    summary:
      "Đào tạo lái xe ô tô tải theo phạm vi hạng C1, phù hợp học viên có nhu cầu vận tải.",
    duration: "5-6 tháng",
  },
  {
    image: cImage,
    name: "C",
    title: "Ô tô tải hạng C",
    summary: "Đào tạo ô tô tải hạng C cho học viên cần nâng cao kỹ năng vận tải chuyên nghiệp.",
    duration: "5-6 tháng",
  },
  {
    image: nhImage,
    name: "Nâng hạng",
    title: "Nâng hạng giấy phép lái xe",
    summary: "Tư vấn và đào tạo nâng hạng GPLX theo nhu cầu thực tế của học viên và quy định hiện hành.",
    duration: "Theo hạng nâng",
  },
] as const;

export function EnrollmentPage() {
  return (
    <section
      className="page-section page-section--band enrollment-section"
      id="tuyen-sinh"
      aria-labelledby="enrollment-title"
    >
      <div className="section-hero">
        <div className="section-hero__inner">
          <h2 id="enrollment-title">Các hạng đào tạo</h2>
          <p>
            Trung tâm đào tạo đầy đủ các hạng giấy phép lái xe theo quy định, hỗ trợ tư vấn lộ
            trình học phù hợp với từng học viên.
          </p>
        </div>
      </div>

      <div className="section-body">
        <div className="training-grid" aria-label="Danh sách hạng đào tạo">
          {trainingGroups.map((group) => (
            <article className="training-card" key={group.name}>
              <div className="training-card__media">
                <img src={group.image} alt="" />
              </div>
              <h3>{group.title}</h3>
              <p className="training-card__summary">{group.summary}</p>
              <div className="training-card__details" aria-label={`Thông tin ${group.name}`}>
                <p className="training-card__detail training-card__detail--time">
                  <span>Học đến thi:</span>
                  <strong>{group.duration}</strong>
                </p>
                <p className="training-card__detail training-card__detail--fee">
                  <span>Học phí:</span>
                  <strong>Liên hệ</strong>
                </p>
              </div>
              <a className="training-card__link" href="#tuyen-sinh">
                Bấm để xem chi tiết
                <span aria-hidden="true">›</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
