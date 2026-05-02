# Notification System Design

## 1. System Overview
The Campus Notifications System is a production-grade, highly responsive web application designed to handle real-time and scheduled notifications for the Affordmed Campus Hiring Evaluation. It systematically ingests, parses, and prioritises large volumes of notifications across diverse categories (Placements, Results, and Events) to ensure candidates never miss critical updates. The system provides both a standard paginated view and an advanced algorithmically-driven Priority Inbox, guaranteeing that time-sensitive and high-impact announcements are always surfaced immediately.

## 2. Architecture
```text
          +-------------------------------------------------------------+
          |                      Client Browser                         |
          |                                                             |
          |  [LoginPage]            [AllNotificationsPage]              |
          |       |                            |                        |
          |       v                            v                        |
          |  [authApi]                  [notificationApi]               |
          |       |                            |                        |
          |       |                      [PriorityEngine]               |
          |       |                            |                        |
          |       v                            v                        |
          +-------|----------------------------|------------------------+
                  |                            |
                  |     +------------------+   |
                  +---> |    [Logger]      | <-+
                        +------------------+
                                |
          +---------------------|---------------------------------------+
          |                     v                                       |
          |              Evaluation Service                             |
          |     (/auth, /notifications, /logs)                          |
          +-------------------------------------------------------------+
```

## 3. Authentication Flow
1. **Credential Input**: The user provides their Email, Name, Roll Number, Access Code, Client ID, and Client Secret in the secure `LoginPage` form.
2. **Token Fetch**: The credentials are sent via a POST request to the `/evaluation-service/auth` endpoint.
3. **In-Memory Storage**: Upon success, the returned `access_token` and `expires_in` values are stored strictly in memory (via closure-based state) within the `authStore` to prevent cross-site scripting (XSS) extraction from `localStorage`.
4. **Expiry Detection**: The client side monitors the token timestamp against the `expires_in` duration. Any API response returning a 401 Unauthorized status instantly triggers the refresh protocol.
5. **Silent Token Refresh**: The `apiClient` intercepts the 401 error, uses a pre-registered callback with the original credentials to seamlessly fetch a new token, and retries the original failed request without disrupting the user experience.

## 4. Data Flow
Data flows unidirectionally from the server to the rendered UI. The `apiClient` executes a GET request to fetch notifications. The raw PascalCase JSON response is immediately mapped through a normalisation function to convert it into predictable camelCase TypeScript objects and parse standard timestamp strings into pure Unix integers. This clean data array is then fed into the `priorityEngine` (for the Priority Inbox) where it is filtered by user-selected categories, passed through a Max-Heap structure for O(n log k) top-N extraction, and finally mapped to `NotificationCard` components for rendering.

## 5. Priority Algorithm
The application employs a deterministic mathematical formula to enforce strict ranking hierarchies:
- **Category Weights**: Placement = 3, Result = 2, Event = 1.
- **Formula**: `priorityScore = (categoryWeight * 10^12) + unixTimestamp`.
- **Dominance**: Because timestamps are roughly 10 digits (e.g., `1713000000`), multiplying the category weight by `10^12` ensures that a lower-tier category (like Event) can never overtake a higher-tier category (like Placement), regardless of how recent it is. Within the same category, the addition of the timestamp guarantees that newer notifications naturally bubble to the top.
- **Efficiency**: Instead of sorting the entire array `O(n log n)`, the `priorityEngine` utilizes a custom Max-Heap to extract only the top N items, achieving `O(n log k)` time complexity.
- **Memoization**: The Priority Queue logic is wrapped in `useMemo` hooks inside the components to guarantee the heap is only rebuilt when the underlying data or top-N limit changes.

## 6. Logging Strategy
- **Function Signature**: The application uses a unified logging interface: `Log(stack, level, package, message)`.
- **Non-blocking Execution**: The logger executes as a fire-and-forget asynchronous background promise.
- **Log Levels**: 
  - `info`: Standard lifecycle events and successful fetches.
  - `warn`: Recoverable network failures (like 5xx retries).
  - `error`: Failed auth attempts and unrecoverable 4xx errors.
  - `fatal`: System crashes or JSON parsing failures.
- **Mapping**: A package-to-module mapping table categorises every log (e.g., `apiClient` maps to `api`, `LoginPage` maps to `page`).
- **UI Performance**: Because the `fetch` call within the logger is entirely decoupled from React's render lifecycle and lacks any `await` chaining, network latency on the logging server can never stall or freeze the user interface.

## 7. API Layer Design
- **Base Client**: `apiClient.ts` serves as the single source of truth for all external HTTP communication, automatically injecting the Bearer token into headers.
- **Retry Logic**: It features a robust exponential backoff system that intercepts 5xx server errors and retries the request up to 2 times, doubling the delay on each attempt to prevent server hammering.
- **401 Handling**: If a token expires, the client intercepts the 401 response, invokes the silent refresh callback, and seamlessly replays the original request.
- **403 Handling**: A 403 Forbidden instantly clears the in-memory state and forces a hard logout to protect secure routes.
- **5xx Handling**: Server errors trigger the backoff mechanism. If retries are exhausted, a user-facing error is thrown.

## 8. Error Handling
| Error Condition | Action Taken | UI Response |
| :--- | :--- | :--- |
| **401 Unauthorized** | Silent refresh → Retry request | None (seamless if successful) |
| **403 Forbidden** | Clear auth state → Force Logout | Redirect to LoginPage |
| **5xx Server Error** | Exponential backoff (max 2 retries) | Display ErrorBanner with Retry |
| **Network Failure** | Log fatal error → Terminate request | Display ErrorBanner with Retry |

## 9. Performance
- **Max-Heap over Array.sort()**: Extracting 50 items from 10,000 notifications using a Max-Heap takes `O(n log k)` operations, which is exponentially faster and less CPU-intensive than a full `O(n log n)` browser-native sort.
- **Component Memoization**: `NotificationCard` is wrapped in `React.memo` to prevent cascading DOM reconciliations when sibling cards or parent states update.
- **Computed Memoization**: All sorting, filtering, and priority scoring is wrapped in `useMemo`, ensuring calculations only fire on direct dependency mutations.
- **Async Logging**: Asynchronous logging prevents sluggish scrolling or frozen UI threads, maintaining 60FPS animations even under heavy telemetry loads.

## 10. Component Architecture
- **App**: Root routing configuration and global Error Boundary.
- **Navbar**: Top-level navigation and dynamic unread notification badging.
- **LoginPage**: Secure credential collection, validation, and auth dispatching.
- **AllNotificationsPage**: Renders the complete, paginated historical log of notifications.
- **PriorityNotificationsPage**: Renders the heap-sorted subset of highly critical, actionable notifications.
- **NotificationList**: Orchestrates the mapping of notification data to visual cards.
- **NotificationCard**: Displays discrete message strings, category chips, and timestamps.
- **FilterBar**: Provides horizontal tab selection for isolating specific categories.
- **TopNSelector**: Provides dropdown limits to constrain priority calculations.
- **LoadingSpinner / ErrorBanner**: Standardized fallback UI boundaries.

## 11. Setup Instructions
**Prerequisites:** 
- Node.js (v18+)
- npm (v9+)

**Installation & Execution:**
1. Navigate to the desired stage directory (e.g., `cd notification_app_stage2`).
2. Run `npm install` to hydrate dependencies.
3. Run `npm start` to launch the local development server on `http://localhost:3000`.
4. Ensure the backend evaluation service is accessible at the proxy address defined in `package.json`.
