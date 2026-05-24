import type { StudentLookupPublic } from "shared";

export type StudentCardProps = {
  student: StudentLookupPublic;
};

function getPublicPhotoUrl(photoUrl: string | null) {
  if (!photoUrl?.startsWith("/uploads/students/")) {
    return null;
  }

  return photoUrl;
}

export function StudentCard({ student }: StudentCardProps) {
  const photoUrl = getPublicPhotoUrl(student.photoUrl);

  return (
    <article className="student-card">
      <div className="student-card__photo-frame">
        {photoUrl ? (
          <img
            alt={`Ảnh học viên ${student.hoVaTen}`}
            className="student-card__photo"
            src={photoUrl}
          />
        ) : (
          <div className="student-card__photo-placeholder" role="img" aria-label="Chưa có ảnh học viên">
            Chưa có ảnh
          </div>
        )}
      </div>

      <div className="student-card__body">
        <h3>{student.hoVaTen}</h3>
        <dl>
          <div>
            <dt>CCCD đã che</dt>
            <dd>{student.soCMTMasked}</dd>
          </div>
          <div>
            <dt>Ngày sinh</dt>
            <dd>{student.ngaySinh}</dd>
          </div>
          <div>
            <dt>Giới tính</dt>
            <dd>{student.gioiTinh}</dd>
          </div>
          <div>
            <dt>Khóa học</dt>
            <dd>{student.tenKhoaHoc ?? "Đang cập nhật"}</dd>
          </div>
          <div>
            <dt>Hạng đào tạo</dt>
            <dd>{student.hang ?? "Đang cập nhật"}</dd>
          </div>
          <div>
            <dt>Địa chỉ</dt>
            <dd>{student.diaChi ?? "Đang cập nhật"}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
