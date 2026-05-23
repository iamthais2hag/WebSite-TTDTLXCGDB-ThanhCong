import { APP_NAV_ITEMS, SITE_NAME } from "../../siteConfig";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__title">{SITE_NAME}</p>
          <p className="site-footer__copy">
            Kênh thông tin chính thức về đào tạo lái xe, tra cứu học viên,
            thông báo và văn bản pháp lý.
          </p>
        </div>

        <nav className="site-footer__nav" aria-label="Điều hướng cuối trang">
          {APP_NAV_ITEMS.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
