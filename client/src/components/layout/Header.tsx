import logoThanhCong from "../../assets/logo-thanh-cong.webp";
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
          <span className="site-brand__mark">
            <img
              className="site-brand__logo"
              src={logoThanhCong}
              alt="Logo Trung tâm Đào tạo Lái xe Thành Công"
              style={identityImageStyle}
            />
          </span>
          <span className="site-brand__text">
            <span className="site-brand__agency">Trung tâm Đào tạo Lái xe</span>
            <strong>THÀNH CÔNG</strong>
            <span className="site-brand__tagline">
              Vững tay lái, an toàn mọi hành trình
            </span>
          </span>
        </a>

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
    </header>
  );
}
