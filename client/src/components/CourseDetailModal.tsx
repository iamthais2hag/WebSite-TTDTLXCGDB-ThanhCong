import { useEffect } from "react";
import { CONSULT_PHONE, ZALO_OA_URL } from "../siteConfig";
import type { TrainingCourse } from "../pages/EnrollmentPage";

const consultPhoneHref = CONSULT_PHONE.replace(/\s/g, "");

type CourseDetailModalProps = {
  course: TrainingCourse | null;
  onClose: () => void;
};

export function CourseDetailModal({ course, onClose }: CourseDetailModalProps) {
  useEffect(() => {
    if (!course) {
      return undefined;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [course, onClose]);

  if (!course) {
    return null;
  }

  return (
    <div className="course-modal" role="presentation">
      <button
        aria-label="Đóng chi tiết hạng đào tạo"
        className="course-modal__overlay"
        type="button"
        onClick={onClose}
      />
      <section
        aria-labelledby="course-modal-title"
        aria-modal="true"
        className="course-modal__panel"
        role="dialog"
      >
        <header className="course-modal__header">
          <div>
            <p>{course.badge}</p>
            <h2 id="course-modal-title">{course.title}</h2>
          </div>
          <button
            aria-label="Đóng"
            className="course-modal__close"
            type="button"
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="course-modal__body">
          <div className="course-modal__summary-card">
            <span>Học phí</span>
            <strong>{course.tuition}</strong>
          </div>
          <div className="course-modal__summary-card">
            <span>Thời gian</span>
            <strong>{course.duration}</strong>
          </div>
          <div className="course-modal__summary-card">
            <span>Loại xe</span>
            <strong>{course.vehicleType}</strong>
          </div>

          <article className="course-modal__info-card course-modal__info-card--wide">
            <h3>Mô tả</h3>
            <p>{course.summary}</p>
          </article>
          <article className="course-modal__info-card">
            <h3>Điều kiện</h3>
            <p>{course.eligibility}</p>
          </article>
          <article className="course-modal__info-card">
            <h3>Hỗ trợ</h3>
            <p>Tư vấn hồ sơ, lịch học và lộ trình phù hợp theo từng học viên.</p>
          </article>
        </div>

        <footer className="course-modal__actions">
          <a className="course-modal__button course-modal__button--phone" href={`tel:${consultPhoneHref}`}>
            Gọi tư vấn
          </a>
          <a
            className="course-modal__button course-modal__button--zalo"
            href={ZALO_OA_URL}
            rel="noreferrer"
            target="_blank"
          >
            Zalo
          </a>
          <button className="course-modal__button course-modal__button--close" type="button" onClick={onClose}>
            Đóng
          </button>
        </footer>
      </section>
    </div>
  );
}
