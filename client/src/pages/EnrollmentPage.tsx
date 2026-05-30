import { useState } from "react";
import { CourseDetailModal } from "../components/CourseDetailModal";
import a1Image from "../assets/a1.png";
import amImage from "../assets/am.png";
import bImage from "../assets/b.png";
import cImage from "../assets/c.png";
import c1Image from "../assets/c1.png";
import nhImage from "../assets/nh.png";
import { CONSULT_PHONE, ZALO_OA_URL } from "../siteConfig";

const consultPhoneHref = CONSULT_PHONE.replace(/\s/g, "");

export const trainingGroups = [
  {
    badge: "Hạng A1",
    code: "A1",
    eligibility:
      "Theo điều kiện đăng ký học và sát hạch giấy phép lái xe hạng A1 hiện hành.",
    image: a1Image,
    name: "A1",
    title: "Mô tô hạng A1",
    summary:
      "Đào tạo lái xe mô tô hai bánh dung tích đến 125cc hoặc xe điện có công suất theo quy định hiện hành.",
    duration: "1-2 tháng",
    tuition: "Liên hệ",
    vehicleType: "Mô tô",
  },
  {
    badge: "Hạng A/AM",
    code: "A/AM",
    eligibility:
      "Theo điều kiện đăng ký học và sát hạch nhóm mô tô A/AM hiện hành.",
    image: amImage,
    name: "A/AM",
    title: "Mô tô hạng A/AM",
    summary: "Đào tạo nhóm mô tô A/AM theo chương trình và phạm vi hạng đã được công bố.",
    duration: "1-2 tháng",
    tuition: "Liên hệ",
    vehicleType: "Mô tô",
  },
  {
    badge: "Hạng B",
    code: "B",
    eligibility:
      "Theo điều kiện đăng ký học và sát hạch giấy phép lái xe hạng B hiện hành.",
    image: bImage,
    name: "B số sàn/số cơ khí/số tự động",
    title: "Ô tô hạng B",
    summary:
      "Đào tạo hạng B số sàn, số cơ khí và số tự động, phù hợp nhu cầu sử dụng xe phổ biến.",
    duration: "3-5 tháng",
    tuition: "Liên hệ",
    vehicleType: "Ô tô",
  },
  {
    badge: "Hạng C1",
    code: "C1",
    eligibility:
      "Theo điều kiện đăng ký học và sát hạch giấy phép lái xe hạng C1 hiện hành.",
    image: c1Image,
    name: "C1",
    title: "Ô tô tải hạng C1",
    summary:
      "Đào tạo lái xe ô tô tải theo phạm vi hạng C1, phù hợp học viên có nhu cầu vận tải.",
    duration: "5-6 tháng",
    tuition: "Liên hệ",
    vehicleType: "Ô tô tải",
  },
  {
    badge: "Hạng C",
    code: "C",
    eligibility:
      "Theo điều kiện đăng ký học và sát hạch giấy phép lái xe hạng C hiện hành.",
    image: cImage,
    name: "C",
    title: "Ô tô tải hạng C",
    summary: "Đào tạo ô tô tải hạng C cho học viên cần nâng cao kỹ năng vận tải chuyên nghiệp.",
    duration: "5-6 tháng",
    tuition: "Liên hệ",
    vehicleType: "Ô tô tải",
  },
  {
    badge: "Hạng Nâng hạng",
    code: "Nâng hạng",
    eligibility:
      "Tư vấn điều kiện theo từng hồ sơ và hạng giấy phép lái xe học viên đang có.",
    image: nhImage,
    name: "Nâng hạng",
    title: "Nâng hạng giấy phép lái xe",
    summary: "Tư vấn và đào tạo nâng hạng GPLX theo nhu cầu thực tế của học viên và quy định hiện hành.",
    duration: "Theo hạng nâng",
    tuition: "Liên hệ",
    vehicleType: "Theo hồ sơ GPLX",
  },
] as const;

export type TrainingCourse = (typeof trainingGroups)[number];

export function EnrollmentPage() {
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);

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
            <button
              aria-haspopup="dialog"
              className="training-card"
              data-course-code={group.code}
              key={group.name}
              type="button"
              onClick={() => setSelectedCourse(group)}
            >
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
                  <strong>{group.tuition}</strong>
                </p>
              </div>
              <span className="training-card__link">
                Bấm để xem chi tiết
                <span aria-hidden="true">›</span>
              </span>
            </button>
          ))}
        </div>

        <div className="enrollment-cta" aria-labelledby="enrollment-cta-title">
          <h3 id="enrollment-cta-title">Sẵn sàng bắt đầu hành trình học lái xe?</h3>
          <p>Liên hệ ngay để được tư vấn khóa học, hồ sơ đăng ký và lịch học phù hợp.</p>
          <div className="enrollment-cta__actions">
            <a
              className="enrollment-cta__button enrollment-cta__button--detail"
              href="#tuyen-sinh"
            >
              Xem chi tiết tuyển sinh
              <span aria-hidden="true">›</span>
            </a>
            <a className="enrollment-cta__button" href={ZALO_OA_URL} rel="noreferrer" target="_blank">
              Liên hệ qua Zalo
            </a>
            <a
              className="enrollment-cta__button enrollment-cta__button--outline"
              href={`tel:${consultPhoneHref}`}
            >
              Gọi điện tư vấn
            </a>
          </div>
        </div>
      </div>
      <CourseDetailModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
    </section>
  );
}
