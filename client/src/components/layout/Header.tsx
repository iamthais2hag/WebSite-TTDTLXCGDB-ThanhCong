import logoThanhCong from "../../assets/logo-thanh-cong.webp";
import {
  APP_NAV_ITEMS,
  SITE_AGENCY_NAME,
  SITE_BRAND_NAME,
  SITE_NAME,
  SITE_SLOGAN,
} from "../../siteConfig";

const identityImageStyle = {
  height: "auto",
  maxWidth: "100%",
  objectFit: "contain",
} as const;

export function Header() {
  return (
    <>
      <div className="site-visual-strip" aria-label="Nhận diện Trung tâm">
        <div className="site-visual-strip__inner">
          <span>{SITE_AGENCY_NAME}</span>
          <strong>{SITE_BRAND_NAME}</strong>
        </div>
      </div>

      <header className="site-header">
        <div className="site-slogan-bar">
          <div className="site-slogan-bar__inner">{SITE_SLOGAN}</div>
        </div>

        <div className="site-header__inner">
          <a className="site-brand" href="#trang-chu" aria-label={SITE_NAME}>
            <span className="site-brand__mark">
              <img
                className="site-brand__logo"
                src={logoThanhCong}
                alt="Logo Trung tâm Đào tạo Lái xe Thành Công"
                style={identityImageStyle}
              />
            </span>
            <span className="site-brand__text">
              <span className="site-brand__agency">{SITE_AGENCY_NAME}</span>
              <strong>{SITE_BRAND_NAME}</strong>
              <span className="site-brand__tagline">{SITE_SLOGAN}</span>
            </span>
          </a>

          <a className="header-consult-button" href="#tuyen-sinh">
            Đăng ký tư vấn
          </a>
        </div>

        <div className="site-nav-bar">
          <div className="site-nav-bar__inner">
            <nav className="site-nav" aria-label="Điều hướng chính">
              <ul className="site-nav__list">
                {APP_NAV_ITEMS.map((item, index) => (
                  <li className="site-nav__item" key={item.href}>
                    <a
                      className={`site-nav__link${index === 0 ? " site-nav__link--active" : ""}`}
                      href={item.href}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
