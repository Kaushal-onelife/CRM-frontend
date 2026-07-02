# Notification System — Staff Notification Center + Push

A full staff notification system: an in-app **Notification Center** (inbox with
read state + deep-links) backed by event-driven + scheduled **push** delivery via
**Expo Push** (free, no Firebase). Android-only, staff-targeted.

## Architecture

Everything flows through ONE backend entry point: `createNotification()` in
`CRM/src/utils/notification.js`. It (1) persists an inbox row per staff user and
(2) pushes to their devices — honoring each user's per-category mute prefs.

**Notification types** (see `CRM/src/utils/notificationEvents.js`):

| Type | Category | Trigger | Deep-link |
|---|---|---|---|
| payment_received | money | bill markPaid / created paid | BillDetail |
| bill_unpaid | money | unpaid bill created | BillDetail |
| bill_aging | money | cron: unpaid 7+ days | BillDetail |
| service_assigned | service | service created w/ assignee | ServiceDetail |
| service_completed | service | markCompleted | ServiceDetail |
| amc_activated | amc | AMC created | AMCDetail |
| amc_expired | amc | checkExpired / daily sweep | AMCDetail |
| amc_renewed | amc | AMC renew | AMCDetail |
| reminder_push_daily | reminder | daily 9 AM digest | Reminders |

**Priority → Android channel:** money = `high`, service/amc/reminder = `default`,
confirmations (service_completed, amc_activated) = `low` (quiet). Channels are
created client-side in `CRM-frontend/src/utils/push.js`.

**Crons:** `dailyReminderPush.js` (9:00 AM IST digest) + `dailyOpsAlerts.js`
(9:15 AM IST — AMC expiry sweep across all tenants + unpaid-bill aging).

**Frontend:**
- `screens/Notifications/NotificationsScreen.js` — the inbox (bell → here).
- Header bell + unread badge: `components/DashboardHeaderRight.js`.
- Per-category toggles: `components/NotificationPrefs.js` (in Settings).
- Deep-link routing: `utils/notificationNav.js` (used by both tap-handler + list).

**API** (all under `/api/me`): `GET /notifications`, `GET /notifications/unread-count`,
`POST /notifications/:id/read`, `POST /notifications/read-all`,
`GET|PATCH /notify-prefs`, plus the existing `POST /push-token` + `/push-token/test`.

## One-time DB migration

Run `repair.sql` then `schema.sql` in the Supabase SQL Editor. The new columns:

```sql
-- users
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_prefs JSONB DEFAULT '{}'::jsonb;
-- notifications (Notification Center backbone)
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'system';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'default';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deep_link JSONB;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE notifications ALTER COLUMN customer_id DROP NOT NULL;
```

(Already included in `CRM/supabase/repair.sql` and `schema.sql`.)

## ⚠️ You MUST use a development build — NOT Expo Go

Expo push tokens do **not** work in Expo Go or on emulators. You need a dev build
on a **real Android phone**.

### Build (EAS cloud — Android)

```bash
cd CRM-frontend
npm install -g eas-cli        # if not installed
eas login                     # your Expo account
eas build --profile development --platform android
```

Download the resulting APK to your phone and install it. Then start the dev server:

```bash
npx expo start --dev-client
```

Open the installed dev build (not Expo Go) and scan the QR / connect.

> If you don't have a `development` profile in `eas.json`, create one:
> ```json
> { "build": { "development": { "developmentClient": true, "distribution": "internal" } } }
> ```

## Testing the pipeline

1. Log in on the dev build → accept the notification permission prompt.
2. Confirm the token saved: check `users.expo_push_token` is non-null in Supabase.
3. **Instant test** (no waiting for the cron): call the test endpoint while logged in:
   ```
   POST /api/me/push-token/test
   ```
   You should receive a "Test notification" on the device within a few seconds.
4. **Test the daily job** without waiting for 9 AM — from the backend:
   ```bash
   cd CRM
   node -e "require('dotenv').config(); require('./src/cron/dailyReminderPush').runDailyReminders()"
   ```
   (Requires the `.env` with Supabase keys. Sends to every tenant that has due items.)

## Notes / gotchas

- **Android only.** iOS push needs an Apple Developer account ($99/yr) + config.
- A "clear day" (nothing due) sends **no** notification — by design.
- Invalid/stale tokens are skipped, not fatal — one bad device won't break the sweep.
- The old `customers.fcm_token` column is unused (leftover from an abandoned
  customer-facing push idea). Staff tokens live on `users.expo_push_token`.
