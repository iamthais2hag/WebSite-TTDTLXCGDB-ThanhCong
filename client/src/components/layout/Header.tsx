import logoThanhCong from "../../assets/logo-thanh-cong.webp";
import {
  APP_NAV_ITEMS,
  SITE_AGENCY_NAME,
  SITE_BRAND_NAME,
  SITE_NAME,
  SITE_SLOGAN,
} from "../../siteConfig";
import { ROUTES, RouteLink, RouteNavLink } from "../../routing";

const identityImageStyle = {
  height: "auto",
  maxWidth: "100%",
  objectFit: "contain",
} as const;

export function Header() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <RouteLink className="site-brand" to={ROUTES.home} aria-label={SITE_NAME}>
          <img
            className="site-brand__logo"
            src={logoThanhCong}
            alt="Logo Trung tâm Đào tạo Lái xe Thành Công"
            style={identityImageStyle}
          />
          <span className="site-brand__text">
            <span className="site-brand__agency">{SITE_AGENCY_NAME}</span>
            <strong>{SITE_BRAND_NAME}</strong>
            <span className="site-brand__tagline">{SITE_SLOGAN}</span>
          </span>
        </RouteLink>

        <nav className="site-nav" aria-label="Điều hướng chính">
          <ul className="site-nav__list">
            {APP_NAV_ITEMS.map((item) => (
              <li className="site-nav__item" key={item.href}>
                <RouteNavLink
                  activeClassName="site-nav__link--active"
                  className="site-nav__link"
                  to={item.href}
                >
                  {item.label}
                </RouteNavLink>
              </li>
            ))}
          </ul>
        </nav>

        <RouteLink className="header-consult-button" to={ROUTES.enrollment}>
          Đăng ký tư vấn
        </RouteLink>
      </div>
    </header>
  );
}
