# PR TOOLS Admin Panel

Admin dashboard for the PR TOOLS single-vendor mobile parts e-commerce platform.

## Configuration

Set the backend API base URL in `.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

No trailing slash. Restart the dev server after changes.

## Stack

- React 19 + TanStack Router (file-based routing)
- TanStack Query for server state
- Tailwind v4 + shadcn/ui
- Zod for form validation
- sonner for toasts

## Project structure

```
src/
  contexts/AuthContext.tsx       Auth state, JWT in localStorage
  lib/api/                       Per-module API service layer
    client.ts                    fetch wrapper, auth header, error normalize
    auth.ts | configuration.ts | products.ts | orders.ts | users.ts
  lib/constants.ts               Statuses, storage keys, page size
  components/
    layout/                      Sidebar, Header, AdminLayout, PageHeader
    common/                      States, Pagination, ConfirmDialog, ImageInput, StatusBadge
    configuration/               Reusable CRUD page for simple config entities
  routes/
    __root.tsx                   Providers (Query, Auth, Toaster)
    login.tsx                    Public login page
    index.tsx                    Redirect to /login or /dashboard
    _admin.tsx                   Auth-guarded layout (sidebar + header)
    _admin/dashboard.tsx
    _admin/profile.tsx
    _admin/configurations.{brands,categories,offer-categories,home-page-sections,banners}.tsx
    _admin/products.{index,new,home-page}.tsx
    _admin/products.$productId.{index,edit}.tsx
    _admin/orders.tsx
    _admin/admin-users.tsx
```

## Notes

- All protected requests automatically include `Authorization: Bearer <token>`.
- A 401 response clears the token and bounces to `/login`.
- The Admin Users list page calls `GET /users/all` — replace with your real listing endpoint when available (see `src/lib/api/users.ts`).
- Image previews resolve relative URLs against `VITE_API_BASE_URL`.
