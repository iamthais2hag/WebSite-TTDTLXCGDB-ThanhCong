import logoThanhCong from "../../assets/logo-thanh-cong.png";
import { APP_NAV_ITEMS, SITE_NAME } from "../../siteConfig";

const identityImageStyle = {
  height: "auto",
  maxWidth: "100%",
  objectFit: "contain",
} as const;

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <a className="site-brand" href="#trang-chu" aria-label={SITE_NAME}>
          <img
            className="site-brand__logo"
            src={logoThanhCong}
            alt="Logo Trung tâm Đào tạo Lái xe Thành Công"
            style={identityImageStyle}
          />
          <span className="site-brand__text">
            <span className="site-brand__eyebrow">Website chính thức</span>
            <strong>{SITE_NAME}</strong>
          </span>
        </a>

        <nav className="site-nav" aria-label="Điều hướng chính">
          <ul className="site-nav__list">
            {APP_NAV_ITEMS.map((item) => (
              <li className="site-nav__item" key={item.href}>
                <a className="site-nav__link" href={item.href}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
