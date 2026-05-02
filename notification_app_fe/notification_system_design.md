# Campus Notifications Priority Inbox — System Design

> **Stage 1** — Priority Inbox implementation as per the campus hiring evaluation.

## 1. System Overview

The Campus Notifications Priority Inbox is a pure-frontend React TypeScript application that allows university students and staff to consume campus announcements through an intelligent, priority-ranked interface. The system connects to an evaluation-service backend over HTTP, authenticates using a token-based (Bearer JWT) scheme, fetches raw notification data, and presents the top-N highest-priority items computed entirely in the browser.

**Purpose:** Replace an unordered notification feed with a semantically ranked inbox that surfaces the most actionable information first. A Placement notice always appears before a Result notice, which always appears before an Event notice — regardless of when they were received.

**Scope:** The application is frontend-only. No backend code, database, or server-side processing is included. All business logic (priority ranking, token lifecycle, filtering) executes client-side.

**User Persona:** A university student or faculty member who receives tens to hundreds of daily campus announcements across placement, academic result, and general event categories. They need the most critical items surfaced immediately without scrolling through noise.

---

## 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Browser (React App)                           │
│                                                                      │
│  ┌──────────────┐    credentials    ┌───────────────────────────┐   │
│  │  LoginPage   │──────────────────▶│       authApi.ts          │   │
│  │  (page)      │                   │  fetchAuthToken()         │   │
│  └──────┬───────┘                   │  refreshAuthToken()       │   │
│         │ on success                └────────────┬──────────────┘   │
│         ▼                                        │ Bearer JWT        │
│  ┌──────────────┐                   ┌────────────▼──────────────┐   │
│  │  InboxPage   │──────────────────▶│       apiClient.ts        │   │
│  │  (page)      │                   │  apiRequest()             │   │
│  └──────┬───────┘                   │  retry / refresh logic    │   │
│         │                           └────────────┬──────────────┘   │
│         ▼                                        │ HTTP              │
│  ┌──────────────────────────────┐                ▼                  │
│  │  useNotifications (hook)     │   ┌─────────────────────────────┐ │
│  │  fetchNotifications()        │──▶│  Evaluation Service         │ │
│  └──────────────┬───────────────┘   │  http://20.207.122.201      │ │
│                 │                   │  POST /auth                 │ │
│                 ▼                   │  GET  /notifications        │ │
│  ┌──────────────────────────────┐   │  POST /logs                 │ │
│  │  usePriorityQueue (hook)     │   └─────────────────────────────┘ │
│  │  extractTopN() via MaxHeap   │                                    │
│  └──────────────┬───────────────┘                                    │
│                 │                                                     │
│                 ▼                                                     │
│  ┌──────────────────────────────┐                                    │
│  │  NotificationList            │                                    │
│  │  NotificationCard ×N         │                                    │
│  │  PriorityBadge               │                                    │
│  └──────────────────────────────┘                                    │
│                                                                      │
│  All modules ──▶ Log() ──▶ POST /logs (non-blocking, fire-and-forget)│
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Authentication Flow

**Step 1 — Credential Input:** The user navigates to the root route (`/`) and is presented with the `LoginPage` component. All six fields (email, name, rollNo, accessCode, clientID, clientSecret) are validated client-side before the form can be submitted. Validation enforces that no field is empty and that the email field contains a syntactically valid address.

**Step 2 — Token Fetch:** On submit, the `useAuth` hook calls `authApi.fetchAuthToken()`, which delegates to `apiClient.apiRequest()`. A `POST` request is made to `/evaluation-service/auth` with the credential payload encoded as JSON. Both the start and success/failure of this call are logged.

**Step 3 — In-Memory Storage:** On a 200 response, the JWT `access_token` and `expires_in` timestamp are stored exclusively in module-level variables inside `state/authStore.ts`. No data is written to `localStorage` or `sessionStorage`. The `isAuthenticated` flag is set to `true`, triggering a re-render in `useAuth` via the subscriber pattern.

**Step 4 — Routing:** The `App.tsx` router watches `isAuthenticated`. Once true, it redirects the user from `/` to `/inbox` using React Router's `<Navigate replace>`.

**Step 5 — Authorization Header:** Every subsequent API call is wrapped in `apiClient.apiRequest()`, which reads the current token from `authStore.getAccessToken()` and injects it as `Authorization: Bearer <token>` in the request headers.

**Step 6 — Silent Refresh:** After storing the token, `scheduleTokenRefresh()` from `tokenUtils.ts` calculates the delay until 60 seconds before expiry (`expires_in × 1000 − Date.now() − 60000` ms) and sets a `window.setTimeout`. When the timer fires, `refreshAuthToken()` is called with the previously stored credentials, a new token is stored, and the timer is rescheduled.

**Step 7 — 401 Handling:** If any API call returns a 401, the `apiClient` attempts a single silent refresh before retrying. If the refresh itself fails, the auth state is cleared and an error is surfaced to the user.

**Step 8 — Logout:** Calling `auth.logout()` cancels any pending refresh timer, clears the stored credentials reference, calls `clearAuthState()` to zero out the in-memory token, and calls `clearRefreshCallback()` so no future refresh can be triggered. The router then redirects to `/`.

---

## 4. Data Flow

```
1. InboxPage mounts
        │
        ▼
2. useNotifications(categoryFilter) called
        │
        ▼
3. fetchNotifications() → POST GET /notifications
        │ raw Notification[] array returned
        ▼
4. Category filter applied in hook
        │ filtered Notification[] 
        ▼
5. usePriorityQueue(filteredNotifications, topN)
        │
        ▼
6. extractTopN() builds MaxHeap of all n items → O(n) insertions
        │
        ▼
7. extractMax() called topN times → O(k log n) extractions
        │ RankedNotification[] with .rank and .priorityScore
        ▼
8. NotificationList renders RankedNotification[]
        │
        ▼
9. NotificationCard rendered for each item (React.memo cached)
```

The `useMemo` in `usePriorityQueue` ensures steps 6–7 only execute when `notifications` or `topN` changes, not on every parent render cycle.

---

## 5. Priority Logic Deep Dive

### Category Weight Table

| Category  | Weight | Rank |
|-----------|--------|------|
| Placement | 3      | 1st  |
| Result    | 2      | 2nd  |
| Event     | 1      | 3rd  |

### Priority Score Formula

```
priorityScore = (categoryWeight × 10¹²) + unixTimestamp
```

This formula guarantees that category weight **always** dominates over timestamp. The multiplier `10¹²` (1 trillion) is chosen because:

- Unix timestamps as of 2025 are approximately `1.7 × 10⁹` seconds.
- The gap between weights is 1 (e.g., Placement weight 3 vs. Result weight 2).
- One unit of weight difference produces a score gap of `10¹²`, which is ~588 times larger than the maximum possible unix timestamp difference achievable within a human lifetime.
- Therefore, no Placement notification can ever score lower than any Result notification, regardless of their timestamps.

**Example:**
```
Placement from 2020: score = (3 × 10¹²) + 1_580_000_000 = 3_001_580_000_000
Result    from 2025: score = (2 × 10¹²) + 1_750_000_000 = 2_001_750_000_000
```
The 2020 Placement still outranks the 2025 Result because `3_001_580_000_000 > 2_001_750_000_000`.

Within the same category, a larger unix timestamp (newer event) produces a larger score, so the freshest notification within a category always ranks highest.

### Max-Heap Extraction Explanation

A max-heap is a complete binary tree where every parent node's score is greater than or equal to its children's scores. The root always holds the maximum element.

**Insertion (O(log n)):** The new element is appended at the bottom and then "bubbled up" by swapping with its parent until the heap property is restored.

**Extract-Max (O(log n)):** The root is removed and returned. The last element is moved to the root and then "sunk down" by swapping with the larger of its two children until the heap property is restored.

### O(n log k) vs O(n log n) Complexity Analysis

| Approach               | Build          | Extract top-k   | Total             |
|------------------------|----------------|-----------------|-------------------|
| Full array sort        | —              | O(n log n)      | **O(n log n)**    |
| Max-heap (this app)    | O(n log n)     | O(k log n)      | **O(n log n)**    |
| Min-heap of size k     | O(k)           | O((n−k) log k)  | **O(n log k)**    |

The current implementation inserts all `n` elements into the heap, then extracts `k` times. For the common case where `k << n` (e.g., top 10 from 10,000 notifications), the extraction phase is `O(k log n) ≈ O(10 × 23) = O(230)` operations rather than `O(n log n) ≈ O(10,000 × 13) = O(130,000)`.

While a min-heap of size `k` would achieve the optimal O(n log k) total, the max-heap approach is chosen here because:
1. All top-k items are needed in sorted order, which the max-heap provides directly.
2. The dataset size (campus notifications) is bounded in practice, making the practical difference negligible.
3. The max-heap implementation is more readable and easier to validate.

### Justification for Heap Approach

Using `Array.prototype.sort()` would impose O(n log n) regardless of `k`. The heap approach decouples n (total data size) from k (display count), ensuring the UI stays responsive even as notification volume grows. The `useMemo` wrapper ensures this computation is cached between renders, so React's frequent re-render cycles do not trigger repeated heap operations.

---

## 6. Component Architecture

### `LoginPage`
- **Props:** `auth: UseAuthReturn`
- **State:** `form: AuthCredentials`, `fieldErrors: FormErrors`
- **Responsibility:** Collect and validate credentials, call `auth.login()`, show loading and error states.

### `InboxPage`
- **Props:** `auth: UseAuthReturn`
- **State:** `categoryFilter: CategoryFilter`, `topN: TopNOption`
- **Responsibility:** Orchestrate `useNotifications` and `usePriorityQueue`, compute category counts for `FilterBar`, delegate rendering to `NotificationList`.

### `FilterBar`
- **Props:** `activeFilter`, `onFilterChange`, `counts`
- **State:** None (controlled)
- **Responsibility:** Render category tabs, surface notification counts, log tab-change events.

### `TopNSelector`
- **Props:** `value`, `onChange`
- **State:** None (controlled)
- **Responsibility:** Render the top-N dropdown, log selection events.

### `NotificationList`
- **Props:** `rankedNotifications`, `isLoading`, `error`, `onRetry`
- **State:** None
- **Responsibility:** Switch between loading, error, empty, and data render states.

### `NotificationCard` (React.memo)
- **Props:** `notification: RankedNotification`
- **State:** None
- **Responsibility:** Render a single card with title, message, category chip, priority badge, and relative timestamp. Memoised to prevent re-renders when sibling cards change.

### `PriorityBadge`
- **Props:** `rank`, `category`
- **State:** None
- **Responsibility:** Display the numeric rank in a category-coloured circular badge with elevated styling for top-3.

### `LoadingSpinner`
- **Props:** `label?`, `fullPage?`
- **State:** None
- **Responsibility:** Centralised loading UI for both full-page and inline contexts.

### `ErrorBanner`
- **Props:** `message`, `onRetry?`, `title?`
- **State:** None
- **Responsibility:** Display error alerts with an optional retry action.

---

## 7. Hook Responsibilities

### `useAuth`
Manages the complete authentication lifecycle. Exposes `isAuthenticated`, `isLoading`, `error`, `login(credentials)`, and `logout()`. Internally subscribes to `authStore` state changes, schedules token refreshes via `scheduleTokenRefresh`, and registers the refresh callback with `apiClient`.

### `useNotifications(categoryFilter)`
Calls `fetchNotifications()` once on mount (and on every `refetch()` invocation), stores the result in local state, applies the category filter, and returns the filtered array along with `isLoading`, `error`, and `refetch`. Never fetches inside a component — all fetch logic lives here.

### `usePriorityQueue(notifications, topN)`
A pure computation hook wrapping `extractTopN()` in `useMemo`. Converts a raw `Notification[]` into a `RankedNotification[]` using the max-heap engine. Recomputes only when `notifications` or `topN` changes.

---

## 8. API Layer Design

### Actual API Response Shape

The evaluation service `/notifications` endpoint returns notifications with **PascalCase field names** and a **string Timestamp**, not the camelCase + unix-number shape originally assumed:

```json
{
  "notifications": [
    {
      "ID": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "Type": "Result",
      "Message": "mid-sem",
      "Timestamp": "2026-04-22 17:51:30"
    }
  ]
}
```

The `notificationApi.ts` normaliser maps these fields:

| API field   | Internal field | Transformation                              |
|-------------|----------------|---------------------------------------------|
| `ID`        | `id`           | Direct copy                                 |
| `Type`      | `category`     | Direct copy (values already match our enum) |
| `Message`   | `message`      | Direct copy (no separate title in the API)  |
| `Timestamp` | `timestamp`    | Parsed via `Date.parse(raw.replace(" ","T")+"Z")`, divided by 1000 → unix seconds |

### Endpoints

| Method | Path                            | Auth Required | Purpose                     |
|--------|----------------------------------|---------------|-----------------------------|
| POST   | `/evaluation-service/auth`       | No            | Fetch / refresh Bearer token|
| GET    | `/evaluation-service/notifications` | Yes         | Fetch all notifications     |
| POST   | `/evaluation-service/logs`       | Optional      | Send structured log entries |

### TypeScript Interfaces
All request and response shapes are defined in `src/types/index.ts`. No `any` types are used anywhere in the codebase.

### Interceptors and Retry Matrix

| HTTP Status | Action                                           |
|-------------|--------------------------------------------------|
| 401         | Attempt silent token refresh, retry once. If refresh fails → logout |
| 403         | Force logout immediately                         |
| 5xx         | Exponential backoff (1s, 2s), max 2 retries     |
| Network err | Log fatal, throw with user-friendly message     |
| 2xx         | Parse JSON, return typed result                 |

All requests flow through `apiClient.apiRequest<T>()`, which handles header injection, status code branching, and retry orchestration. No component or hook calls `fetch()` directly.

---

## 9. Logging Strategy

### Log() Contract

```typescript
Log(stack: string, level: string, package: string, message: string): void
```

The function is the single source of truth in `src/middleware/logger.ts`. It validates all parameters before dispatching. If any parameter is invalid, the call is silently discarded rather than throwing, preventing logging bugs from crashing the application.

### Package-to-Module Mapping

| Package      | Used In                                          |
|--------------|--------------------------------------------------|
| `api`        | `apiClient.ts`, `authApi.ts`, `notificationApi.ts` |
| `auth`       | `useAuth.ts`, `authApi.ts`, token refresh paths |
| `component`  | All `components/` and `pages/` on mount/interaction |
| `hook`       | `useNotifications.ts`, `usePriorityQueue.ts`    |
| `page`       | `LoginPage.tsx`, `InboxPage.tsx`                |
| `state`      | `authStore.ts`                                  |
| `middleware` | `logger.ts` internal (self-reference avoided)   |
| `utils`      | `priorityEngine.ts`, `tokenUtils.ts`            |

### What is Logged at Each Level

| Level   | When                                                              |
|---------|-------------------------------------------------------------------|
| `debug` | Priority computation start/end, filter application, hook details |
| `info`  | API call start/success, token fetch/refresh, component mount, user interactions |
| `warn`  | 401 received (before retry), form validation failure, retry attempt |
| `error` | Login failure, non-fatal API errors, form errors surfaced to user |
| `fatal` | Network failures, unhandled exceptions in catch blocks, failed token refresh |

### Non-Blocking Async Logging Implementation

The `Log()` function calls `fetch(ENDPOINTS.LOGS, ...)` and explicitly does **not** `await` it. The returned Promise is also not stored. A `.catch(() => {})` handler swallows any network errors silently. This design ensures:

1. Log calls never block the UI thread.
2. A failing log server never degrades application functionality.
3. Log calls can be placed anywhere — in render paths, event handlers, or async functions — without requiring `async/await` plumbing.

---

## 10. Performance Considerations

### Heap Rationale
The max-heap ensures that displaying the top-10 out of 1,000 notifications requires approximately O(1,000 log 1,000) = ~10,000 operations for insertion, then O(10 × log 1,000) ≈ 100 operations for extraction — compared to O(1,000 × 10) = 10,000 for a naive sort. As notification volume scales, the heap advantage grows.

### useMemo for Priority Score
The `usePriorityQueue` hook wraps `extractTopN()` in `useMemo([notifications, topN])`. React re-renders can occur frequently (parent state changes, context updates, etc.). Without memoisation, the O(n log n) heap construction would run on every render. With `useMemo`, it only runs when the actual inputs change.

### React.memo on NotificationCard
Each `NotificationCard` is wrapped with `React.memo`. Since the parent `NotificationList` receives a new array reference on every render, without memoisation every card would re-render even if its own data is unchanged. `React.memo` performs a shallow prop comparison, skipping re-renders for cards whose `notification` object reference has not changed.

---

## 11. Error Handling Matrix

| Scenario                  | Detection                  | Action                                           | User Impact                        |
|---------------------------|----------------------------|-------------------------------------------------|-------------------------------------|
| 401 Unauthorized          | `response.status === 401`  | Silent refresh → retry once                    | Transparent if refresh succeeds    |
| 401 + refresh failed      | Refresh throws             | Clear auth state, throw error                  | Redirected to login page           |
| 403 Forbidden             | `response.status === 403`  | Clear auth state immediately                   | Redirected to login page           |
| 5xx Server Error          | `response.status >= 500`   | Exponential backoff, max 2 retries             | ErrorBanner with Retry button      |
| Network Failure           | `fetch()` throws           | Log fatal, throw user-friendly message         | ErrorBanner with Retry button      |
| JSON Parse Error          | `response.json()` throws   | Log fatal, throw message                       | ErrorBanner with Retry button      |
| Form Validation Failure   | Client-side validators     | Inline field errors, no API call               | Red helper text per field          |
| Unhandled Render Error    | `AppErrorBoundary.catch`   | Log fatal, show recovery UI                    | Try Again button resets boundary   |

---

## 12. Setup Instructions

### Prerequisites
- **Node.js:** v18 or higher (v20 LTS recommended)
- **npm:** v9 or higher (bundled with Node.js)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd notification_app_fe

# Install dependencies
npm install
```

### Environment Configuration
This application requires **no environment variables** or `.env` files. The base URL (`http://20.207.122.201`) is defined in `src/config/constants.ts`. All credentials are entered through the in-app login form at runtime.

### Running in Development

```bash
npm start
```

The app will open at `http://localhost:3000`. The development server hot-reloads on file changes.

### Building for Production

```bash
npm run build
```

The optimised bundle is output to the `build/` directory. Serve it with any static file server:

```bash
npx serve -s build
```

### Entering Credentials
On startup, the app displays a login form. Enter:
- **Email:** Your institutional email address
- **Name:** Your full name
- **Roll No:** Your student/staff roll number
- **Access Code:** Provided by the evaluation team
- **Client ID:** Provided by the evaluation team
- **Client Secret:** Provided by the evaluation team

All credentials are sent once to the auth endpoint and never stored on disk.
