# Frontend Routing Note

Frontend public pages use SPA routes:

- `/`
- `/tuyen-sinh`
- `/tra-cuu`
- `/thong-bao`
- `/phap-ly`

Vite dev serves these routes with an `index.html` fallback. Static hosting, Nginx, or a reverse proxy must also fallback these frontend routes to `index.html` before returning 404.

Do not rewrite backend API routes, sync upload routes, or runtime upload files to the frontend app.

## Express hosting

The server can serve the built frontend when `client/dist/index.html` exists, or when `CLIENT_DIST_DIR` points to a built frontend directory. The SPA fallback is intentionally limited to the public frontend routes above.

The fallback must be registered after API, sync, and upload routes so these paths are not swallowed by the frontend app:

- `/api/trpc`
- `/api/sync/*`
- `/uploads/students/*`

## Nginx hosting

Use a separate location for API/sync/uploads, then let frontend routes fallback to `index.html`:

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:3000;
}

location /uploads/students/ {
  proxy_pass http://127.0.0.1:3000;
}

location / {
  try_files $uri $uri/ /index.html;
}
```

Do not apply the frontend fallback inside API, sync upload, or runtime upload locations.
