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
    summary: "Đào tạo lái xe mô tô hạng A1.",
  },
  {
    image: amImage,
    name: "A/AM",
    summary: "Nhóm đào tạo mô tô theo dữ liệu được xác nhận.",
  },
  {
    image: bImage,
    name: "B số sàn/số cơ khí/số tự động",
    summary: "Nhóm đào tạo lái xe ô tô hạng B.",
  },
  {
    image: c1Image,
    name: "C1",
    summary: "Đào tạo lái xe ô tô tải hạng C1.",
  },
  {
    image: cImage,
    name: "C",
    summary: "Đào tạo lái xe ô tô tải hạng C.",
  },
  {
    image: nhImage,
    name: "Nâng hạng",
    summary: "Thông tin nâng hạng theo chương trình được công bố.",
  },
] as const;

export function EnrollmentPage() {
  return (
    <section className="page-section enrollment-section" id="tuyen-sinh" aria-labelledby="enrollment-title">
      <div className="section-heading">
        <p className="section-eyebrow">Tuyển sinh</p>
        <h2 id="enrollment-title">Các nhóm đào tạo</h2>
        <p>
          Thông tin tuyển sinh được đặt sau các nhóm nội dung chính thống của
          Trung tâm và chỉ dùng bộ asset đã được duyệt.
        </p>
      </div>

      <div className="training-grid" aria-label="Danh sách nhóm đào tạo">
        {trainingGroups.map((group) => (
          <article className="training-card" key={group.name}>
            <div className="training-card__media">
              <img src={group.image} alt="" />
            </div>
            <h3>{group.name}</h3>
            <p>{group.summary}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
