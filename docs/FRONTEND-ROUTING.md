# Frontend Routing Note

Frontend public pages use SPA routes:

- `/`
- `/tuyen-sinh`
- `/tra-cuu`
- `/thong-bao`
- `/phap-ly`

Vite dev serves these routes with an `index.html` fallback. Static hosting, Nginx, or a reverse proxy must also fallback these frontend routes to `index.html` before returning 404.

Do not rewrite backend API routes, sync upload routes, or runtime upload files to the frontend app.
