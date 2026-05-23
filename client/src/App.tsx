import "./App.css";
import mascotCar from "./assets/mascot-car.png";
import { Layout } from "./components/layout/Layout";

export function App() {
  return (
    <Layout>
      <section className="hero-banner" id="trang-chu" aria-labelledby="home-title">
        <div className="hero-banner__content">
          <p className="hero-banner__eyebrow">Website chính thức</p>
          <h1 id="home-title">Trung tâm Đào tạo Lái xe Thành Công</h1>
          <p className="hero-banner__lead">
            Kênh thông tin chính thống về đào tạo lái xe, tra cứu học viên,
            thông báo và văn bản pháp lý của Trung tâm.
          </p>
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
          <img
            className="hero-banner__mascot"
            src={mascotCar}
            alt=""
            style={{ height: "auto", maxWidth: "100%", objectFit: "contain" }}
          />
        </div>
      </section>

      <section className="home-overview" aria-label="Nhóm nội dung chính">
        <article className="info-card">
          <h2>Thông tin đào tạo</h2>
          <p>
            Tổng quan các nhóm hạng đào tạo và thông tin chính thức của Trung
            tâm.
          </p>
        </article>
        <article className="info-card" id="tra-cuu">
          <h2>Tra cứu học viên</h2>
          <p>
            Khu vực tra cứu hồ sơ học viên sẽ được triển khai bằng tRPC ở bước
            tiếp theo.
          </p>
        </article>
        <article className="info-card" id="thong-bao">
          <h2>Thông báo</h2>
          <p>
            Cập nhật thông báo, lịch học và các thông tin vận hành chính thức.
          </p>
        </article>
        <article className="info-card" id="phap-ly">
          <h2>Pháp lý</h2>
          <p>
            Khu vực tổng hợp văn bản, quy định và thông tin pháp lý liên quan
            đến đào tạo lái xe.
          </p>
        </article>
        <article className="info-card" id="tuyen-sinh">
          <h2>Tuyển sinh</h2>
          <p>
            Thông tin tuyển sinh được đặt sau các nhóm nội dung chính thống của
            Trung tâm.
          </p>
        </article>
      </section>
    </Layout>
  );
}
