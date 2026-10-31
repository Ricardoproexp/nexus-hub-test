# AGENTS.md
- Bookings are created only via the `place_booking` RPC — it checks slot conflicts, computes the deposit and links shop items atomically.
- Shop orders go through the `place_order` RPC — stock is validated and decremented in one transaction.
- Company dashboard pages wrap content in `DashboardLayout` — it provides realtime order alerts and the sidebar.
- Product images use the `company-avatars` bucket under `uid/products/` — public buckets are blocked in this workspace.
