export const APP_ROUTES = [
  "Trang chủ",
  "Tra cứu",
  "Thông báo",
  "Pháp lý",
  "Tuyển sinh",
] as const;

export function App() {
  return (
    <main>
      <header>
        <h1>Trung tâm Đào tạo Lái xe Thành Công</h1>
        <nav aria-label="Điều hướng chính">
          <ul>
            {APP_ROUTES.map((route) => (
              <li key={route}>{route}</li>
            ))}
          </ul>
        </nav>
      </header>
      <section aria-labelledby="app-shell-title">
        <h2 id="app-shell-title">Website chính thức</h2>
        <p>App shell tối thiểu cho giai đoạn cấu hình frontend.</p>
      </section>
    </main>
  );
}
