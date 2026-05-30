import logoThanhCong from "../../assets/logo-thanh-cong.webp";
import {
  CONSULT_PHONE,
  SITE_AGENCY_NAME,
  SITE_BRAND_NAME,
  SITE_NAME,
  SITE_SLOGAN,
  ZALO_OA_URL,
} from "../../siteConfig";

const FOOTER_YEAR = 2026;
const consultPhoneHref = CONSULT_PHONE.replace(/\s/g, "");

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="site-footer__identity">
            <img
              className="site-footer__logo"
              src={logoThanhCong}
              alt="Logo Trung tâm Thành Công"
            />
            <div>
              <p className="site-footer__eyebrow">{SITE_AGENCY_NAME}</p>
              <p className="site-footer__title">{SITE_BRAND_NAME}</p>
              <p className="site-footer__slogan">{SITE_SLOGAN}</p>
            </div>
          </div>
          <p className="site-footer__copy">
            {SITE_NAME}. Đào tạo, tư vấn hồ sơ và đồng hành cùng học viên trong quá trình học lái
            xe tại khu vực Đắk Lắk.
          </p>
        </div>

        <div className="site-footer__column">
          <h2 className="site-footer__heading">Thông tin trung tâm</h2>
          <ul className="site-footer__list">
            <li>Trụ sở: Đắk Lắk</li>
            <li>Sân tập: Đang cập nhật</li>
            <li>MST: Đang cập nhật</li>
            <li>Khu vực: Đắk Lắk</li>
          </ul>
        </div>

        <div className="site-footer__column">
          <h2 className="site-footer__heading">Liên hệ</h2>
          <ul className="site-footer__list">
            <li>
              <a href={ZALO_OA_URL} rel="noreferrer" target="_blank">
                Zalo OA
              </a>
            </li>
            <li>
              <a href={`tel:${consultPhoneHref}`}>Gọi điện tư vấn</a>
            </li>
            <li>Thông tin được cập nhật theo hồ sơ trung tâm</li>
          </ul>
        </div>
      </div>
      <div className="site-footer__bottom">
        © {FOOTER_YEAR} Trung tâm đào tạo lái xe cơ giới đường bộ Thành Công. Mọi quyền được bảo
        lưu.
      </div>
    </footer>
  );
}
