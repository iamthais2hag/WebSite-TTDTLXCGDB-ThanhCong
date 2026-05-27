const announcements = [
  "Thông báo lịch học và lịch thi",
  "Cập nhật quy trình tiếp nhận hồ sơ",
  "Hướng dẫn chuẩn bị giấy tờ khi đến Trung tâm",
] as const;

export function AnnouncementsPage() {
  return (
    <section className="page-section page-section--band" id="thong-bao" aria-labelledby="announcements-title">
      <div className="section-hero">
        <div className="section-hero__inner">
          <p className="section-eyebrow">Thông báo</p>
          <h2 id="announcements-title">Thông báo mới</h2>
          <p>
            Khu vực hiển thị thông báo chính thức của Trung tâm. Nội dung động
            sẽ được bổ sung ở các bước sau nếu được duyệt.
          </p>
        </div>
      </div>

      <div className="section-body">
        <div className="list-panel" aria-label="Danh sách thông báo mẫu">
          {announcements.map((item) => (
            <article className="list-row" key={item}>
              <span className="list-row__marker" aria-hidden="true" />
              <h3>{item}</h3>
              <p>Đang cập nhật nội dung chi tiết.</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
