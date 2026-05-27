import {
  APP_NAV_ITEMS,
  CONSULT_PHONE,
  SITE_AGENCY_NAME,
  SITE_BRAND_NAME,
  SITE_NAME,
  SITE_SLOGAN,
} from "../../siteConfig";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__eyebrow">{SITE_AGENCY_NAME}</p>
          <p className="site-footer__title">{SITE_BRAND_NAME}</p>
          <p className="site-footer__copy">
            {SITE_NAME} là kênh thông tin chính thức về đào tạo lái xe, tra cứu
            học viên, thông báo và văn bản pháp lý.
          </p>
          <p className="site-footer__slogan">{SITE_SLOGAN}</p>
        </div>

        <nav className="site-footer__nav" aria-label="Điều hướng cuối trang">
          {APP_NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-footer__contact">
          <span>Tư vấn</span>
          <strong>{CONSULT_PHONE}</strong>
        </div>
      </div>
    </footer>
  );
}
