# TicketHub — System Design Document

## 1. Requirements

### 1.1 System Overview

TicketHub is an online ticketing platform where users discover events, view available seats, temporarily reserve seats, pay for their reservations, and access their purchased tickets.

The system must support 2 million registered users. On a normal day, 50,000 people visit the website, each viewing an average of 10 pages, while 5,000 tickets are sold.

During a popular concert sale, 200,000 people attempt to purchase tickets for only 20,000 available seats within the first 10 minutes.

The design must provide a responsive browsing experience, maintain correct ticket inventory, prevent double-booking, and remain reliable during sudden traffic spikes.

### 1.2 Functional Requirements

| ID | Requirement | Description |
|---|---|---|
| FR1 | User accounts | Users can register, log in, and access their accounts. |
| FR2 | Browse events | Users can browse, search, and filter events by name, date, venue, or category. |
| FR3 | View event details | Users can view event descriptions, dates, venues, prices, and sale status. |
| FR4 | View seats | Users can view seats, prices, and displayed availability for an event. |
| FR5 | Reserve seats | Users can temporarily hold available seats before paying. |
| FR6 | Prevent double-booking | The system prevents two customers from purchasing the same seat for the same event. |
| FR7 | Process payments | Users can pay for their reservations through a payment provider. |
| FR8 | Confirm orders | Orders are confirmed only after successful payment verification and validation of the reservation. |
| FR9 | View tickets | Users can view their confirmed orders and tickets. |
| FR10 | Release expired holds | Seats are released when their holds expire without a completed purchase. |
| FR11 | Handle payment notifications | The system safely processes payment-provider webhooks, including repeated notifications. |
| FR12 | Manage events | Authorized administrators can create events, configure seats, set prices, and manage ticket sales. |

### 1.3 Non-Functional Requirements

| Category | Requirement | Target or approach |
|---|---|---|
| Performance | Event listings and details should load quickly. | Target p95 response time below 300 ms for cached read requests under normal load. |
| Performance | Reservation requests should remain responsive. | Target p95 application processing time below 500 ms, excluding external payment delays. |
| Scalability | The system must handle sudden increases in traffic. | Use horizontally scalable application instances and controlled admission during major sales. |
| Correctness | A seat must not be sold to multiple customers. | Use atomic conditional updates, database transactions, and unique constraints. |
| Reliability | Confirmed orders must remain durable. | Use transactional database writes, backups, and tested recovery procedures. |
| Fairness | Users should have a reasonable opportunity to access popular sales. | Use a transparent virtual waiting-room policy, rate limits, and abuse prevention. |
| Security | Accounts and purchases must be protected. | Use HTTPS, authentication, authorization, input validation, and secure payment integration. |
| Availability | Browsing should remain available during high traffic. | Cache public event information and isolate read traffic from critical reservation operations. |
| Maintainability | Developers should be able to maintain the system. | Use documented APIs, modular services, automated tests, logs, and monitoring. |

These performance targets are initial design goals that must be validated through load testing.

### 1.4 Correctness and Fairness Rules

TicketHub distinguishes between viewing a seat, holding a seat, paying for a reservation, and owning a confirmed ticket.

- Viewing a seat does not reserve it.
- A hold is temporary and does not guarantee ownership.
- A ticket is issued only after payment is verified and the order is successfully confirmed.
- Repeated requests must not create duplicate holds, orders, payments, or tickets.
- Expired holds must be released safely without interfering with valid purchase processing.
- The system must not confirm more tickets than the available inventory.
- Users must not gain unlimited access by repeatedly submitting reservation requests.
- Users who cannot obtain tickets must receive a clear explanation rather than a false confirmation.

A virtual waiting room controls entry into the purchase process. A transparent policy, such as randomized ordering among users eligible before the sale begins, can reduce advantages from simply refreshing repeatedly. Rate limits and queue-token validation help prevent abuse.

The waiting room improves orderly access but cannot guarantee a ticket to everyone when demand exceeds supply.

---

## 2. Traffic and Capacity Estimates

### 2.1 Assumptions

The estimates use the following assumptions:

1. One day contains 86,400 seconds.
2. Each normal-day visitor views 10 pages.
3. Each page view generates an average of three backend read requests.
4. Each completed ticket sale generates approximately four core application operations: order creation, payment initiation, payment confirmation, and ticket retrieval.
5. During the popular sale, 200,000 prospective buyers attempt to purchase tickets within 600 seconds.
6. Each prospective buyer initially requests one seat.
7. The initial calculations use average traffic rates and do not represent the maximum instantaneous burst.
8. Cached responses reduce database load, so backend requests and database queries are not assumed to be identical.

These are planning assumptions rather than measured production data.

### 2.2 Normal-Day Estimates

#### A. Daily page views

Daily visitors = 50,000

Average page views per visitor = 10

Daily page views:

50,000 × 10 = 500,000 page views per day.

Average page views per second:

500,000 ÷ 86,400 ≈ 5.79 page views per second.

#### B. Backend read requests

Assuming three backend read requests per page view:

500,000 × 3 = 1,500,000 read requests per day.

Average read requests per second:

1,500,000 ÷ 86,400 ≈ 17.36 read requests per second.

This is the daily average. Actual traffic will vary by time of day.

#### C. Normal ticket sales

Daily ticket sales = 5,000.

Average ticket sales per second:

5,000 ÷ 86,400 ≈ 0.058 tickets per second.

Average ticket sales per hour:

5,000 ÷ 24 ≈ 208.33 tickets per hour.

#### D. Core order and payment operations

Assuming four core application operations per completed sale:

5,000 × 4 = 20,000 operations per day.

Average operations per second:

20,000 ÷ 86,400 ≈ 0.23 operations per second.

Additional requests may arise from abandoned holds, payment failures, retries, and unsuccessful purchases.

### 2.3 Popular Concert Sale Estimates

The sale attracts 200,000 prospective buyers for 20,000 seats within 10 minutes.

Sale duration:

10 × 60 = 600 seconds.

#### A. Purchase attempts per second

200,000 ÷ 600 ≈ 333.33 purchase attempts per second.

TicketHub must therefore handle approximately 333 purchase attempts per second on average throughout the sale.

This excludes additional browsing, seat-map refreshes, payment callbacks, retries, and traffic bursts.

#### B. Demand compared with supply

Prospective buyers = 200,000.

Available seats = 20,000.

Demand-to-supply ratio:

200,000 ÷ 20,000 = 10.

There are approximately 10 prospective buyers for every available seat.

If every buyer wants one seat, at most 20,000 buyers can succeed.

Percentage of prospective buyers who can obtain a seat:

(20,000 ÷ 200,000) × 100 = 10%.

The remaining prospective buyers cannot all receive tickets because the inventory is limited.

#### C. Maximum theoretical sales rate

If all 20,000 seats are sold evenly over 600 seconds:

20,000 ÷ 600 ≈ 33.33 tickets per second.

Therefore, the system faces approximately 333 purchase attempts per second even though the maximum evenly distributed successful sales rate is approximately 33.33 tickets per second.

Failed reservation attempts must not create additional inventory or confirmed tickets.

#### D. Illustrative read-request load

Assume each prospective buyer makes three seat-map or availability requests during the 10-minute window.

Total read requests:

200,000 × 3 = 600,000 requests.

Average read requests per second:

600,000 ÷ 600 = 1,000 read requests per second.

Adding approximately 333 reservation attempts per second gives:

1,000 + 333 ≈ 1,333 requests per second.

This is an illustrative scenario. Actual traffic depends on user behavior, caching, the waiting-room policy, and retry rates.

The initial burst may be significantly higher than the average.

### 2.4 Normal Traffic Versus Big-Sale Traffic

| Metric | Normal Day | Popular Concert Sale |
|---|---:|---:|
| Visitors or prospective buyers | 50,000 visitors per day | 200,000 prospective buyers in 10 minutes |
| Page views | 500,000 per day | Depends on sale behavior |
| Average page views per second | 5.79 | Not specified |
| Estimated backend read requests | 17.36 per second on average | 1,000 per second in the illustrative scenario |
| Purchase attempts | 5,000 tickets sold per day; exact attempt rate unknown | Approximately 333 per second |
| Available seats | Varies by event | 20,000 |
| Demand-to-supply ratio | Varies by event | 10:1 |
| Main challenge | Efficient browsing and reliable transactions | Sudden traffic, database contention, fairness, and inventory correctness |

Illustrative read traffic during the sale:

1,000 ÷ 17.36 ≈ 57.6 times the normal-day average.

The important difference is not only the volume of traffic but also its concentration within a short time.

### 2.5 Capacity Planning

TicketHub will:

1. Cache public event information.
2. Serve static assets through a content delivery network.
3. Scale stateless application instances horizontally.
4. Use a virtual waiting room to regulate entry into the reservation flow.
5. Apply rate limits to prevent reservation abuse.
6. Keep critical inventory changes in a transactional database.
7. Avoid routing every browsing request to the primary database.
8. Load-test reservation operations and payment processing before major sales.
9. Monitor request latency, queue depth, database contention, and payment failures.
10. Reduce admission rates when critical services approach their tested capacity.

---

## 3. API Design

TicketHub exposes a REST-style HTTP API using JSON request and response bodies.

Protected endpoints require authentication. Users can access only their own holds, orders, and tickets. Administrative operations require additional authorization.

### 3.1 Endpoint Summary

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/events` | Browse and filter events |
| GET | `/api/v1/events/{eventId}` | View event details |
| GET | `/api/v1/events/{eventId}/seats` | View seats, prices, and displayed availability |
| POST | `/api/v1/seat-holds` | Temporarily reserve seats |
| GET | `/api/v1/seat-holds/{holdId}` | Check hold status and expiry |
| POST | `/api/v1/orders` | Create an order from a valid hold |
| POST | `/api/v1/orders/{orderId}/payment` | Initiate payment |
| POST | `/api/v1/payments/webhook` | Receive payment-provider notifications |
| GET | `/api/v1/me/orders` | View the authenticated user's orders |
| GET | `/api/v1/me/tickets` | View the authenticated user's confirmed tickets |

### 3.2 Browse Events

**Request**

`GET /api/v1/events?category=music&page=1&limit=20`

**Purpose:** Returns published events with optional filters and pagination.

**Example response**

```json
{
  "data": [
    {
      "id": "evt_1001",
      "name": "Summer Music Festival",
      "venue": "City Arena",
      "startsAt": "2026-12-20T18:00:00Z",
      "status": "on_sale"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120
  }
}
```

The endpoint returns only publicly visible events. Frequently requested results may be cached.

### 3.3 View Event Details

**Request**

`GET /api/v1/events/evt_1001`

**Purpose:** Returns an event's public information.

**Example response**

```json
{
  "id": "evt_1001",
  "name": "Summer Music Festival",
  "venue": "City Arena",
  "startsAt": "2026-12-20T18:00:00Z",
  "status": "on_sale",
  "currency": "KES"
}
```

The endpoint returns `404 Not Found` if the event does not exist or is not publicly accessible.

### 3.4 View Seats

**Request**

`GET /api/v1/events/evt_1001/seats`

**Purpose:** Displays seat labels, prices, and current availability information.

**Example response**

```json
{
  "eventId": "evt_1001",
  "seats": [
    {
      "id": "seat_501",
      "label": "A-12",
      "price": 5000,
      "currency": "KES",
      "status": "available"
    },
    {
      "id": "seat_502",
      "label": "A-13",
      "price": 5000,
      "currency": "KES",
      "status": "held"
    }
  ]
}
```

Displayed availability is advisory. Another user may reserve a seat before the next request. The server must verify availability against the authoritative database when processing a hold.

Large venues should use pagination, sections, or compact seat-map responses.

### 3.5 Hold Seats

**Request**

`POST /api/v1/seat-holds`

Headers:

- `Authorization: Bearer <access-token>`
- `Idempotency-Key: <unique-request-key>`

Request body:

```json
{
  "eventId": "evt_1001",
  "seatIds": ["seat_501", "seat_502"]
}
```

**Successful response**

```json
{
  "holdId": "hold_9001",
  "eventId": "evt_1001",
  "status": "active",
  "seatIds": ["seat_501", "seat_502"],
  "expiresAt": "2026-12-20T17:10:00Z"
}
```

The server validates the event, sale status, seat IDs, and user's eligibility.

All requested seats must be reserved atomically when the request requires the complete group. If any seat is unavailable, the transaction rolls back.

A configurable short hold period, such as five minutes, gives the user time to pay. The server determines the expiry time.

Possible errors include:

- `400 Bad Request`: Invalid input.
- `401 Unauthorized`: Missing or invalid authentication.
- `409 Conflict`: One or more seats are unavailable.
- `429 Too Many Requests`: Rate limit exceeded.

The idempotency key prevents a repeated request from accidentally creating another hold.

### 3.6 Check Hold Status

**Request**

`GET /api/v1/seat-holds/hold_9001`

**Purpose:** Returns the hold's status and expiry time.

**Example response**

```json
{
  "holdId": "hold_9001",
  "status": "active",
  "expiresAt": "2026-12-20T17:10:00Z"
}
```

Possible statuses are `active`, `converted`, `expired`, and `cancelled`.

The server verifies that the authenticated user owns the hold or has appropriate administrative permission.

### 3.7 Create an Order

**Request**

`POST /api/v1/orders`

Header:

`Idempotency-Key: <unique-request-key>`

Request body:

```json
{
  "holdId": "hold_9001"
}
```

**Successful response**

```json
{
  "orderId": "ord_7001",
  "status": "pending_payment",
  "totalAmount": 10000,
  "currency": "KES",
  "paymentRequired": true
}
```

The server verifies that the hold belongs to the user and remains valid. It calculates the order amount from trusted server-side pricing data.

The order and its association with the hold are created transactionally. Repeated requests with the same idempotency key return the existing logical result rather than creating duplicate orders.

### 3.8 Initiate Payment

**Request**

`POST /api/v1/orders/ord_7001/payment`

Header:

`Idempotency-Key: <unique-request-key>`

Request body:

```json
{
  "paymentMethod": "mobile_money"
}
```

**Successful response**

```json
{
  "orderId": "ord_7001",
  "paymentStatus": "pending",
  "paymentReference": "pay_8001",
  "message": "Complete payment using the payment provider's instructions."
}
```

The payment service initiates payment with the selected provider.

The system does not confirm an order simply because the browser displays a success page. It verifies the payment through an authenticated provider notification or an authoritative status check.

Payment requests must be idempotent, and external payment calls must not occur inside long-running database transactions.

### 3.9 Payment Webhook

**Request**

`POST /api/v1/payments/webhook`

**Illustrative request body**

```json
{
  "providerEventId": "provider_event_123",
  "paymentReference": "pay_8001",
  "orderId": "ord_7001",
  "status": "succeeded",
  "amount": 10000,
  "currency": "KES"
}
```

The server verifies the provider's signature or equivalent authentication mechanism and checks the payment reference, order, amount, currency, and payment status.

A unique provider-event identifier prevents repeated notifications from being processed as separate successful payments.

Order confirmation and ticket issuance must be idempotent and transaction-safe.

If payment succeeds after the hold expires and the seat has been reassigned, the system must not confirm a conflicting ticket. It must reconcile the payment through a safe cancellation or refund process and alert operations when necessary.

### 3.10 View Orders

**Request**

`GET /api/v1/me/orders`

**Purpose:** Lists the authenticated user's orders.

**Example response**

```json
{
  "orders": [
    {
      "id": "ord_7001",
      "status": "confirmed",
      "totalAmount": 10000,
      "currency": "KES",
      "createdAt": "2026-12-20T17:05:00Z"
    }
  ]
}
```

The endpoint must not expose orders belonging to other users.

### 3.11 View Tickets

**Request**

`GET /api/v1/me/tickets`

**Purpose:** Lists the authenticated user's confirmed tickets.

**Example response**

```json
{
  "tickets": [
    {
      "ticketId": "tkt_3001",
      "eventId": "evt_1001",
      "eventName": "Summer Music Festival",
      "seatLabel": "A-12",
      "status": "valid"
    }
  ]
}
```

Tickets are issued only after successful order confirmation. Ticket identifiers or QR codes must be verifiable without exposing unnecessary personal information.

### 3.12 Error Responses

Example error body:

```json
{
  "error": {
    "code": "SEAT_UNAVAILABLE",
    "message": "One or more selected seats are no longer available."
  }
}
```

| HTTP status | Meaning | Example |
|---|---|---|
| 400 | Bad request | Missing or invalid fields |
| 401 | Unauthorized | Missing or invalid access token |
| 403 | Forbidden | Accessing another user's order |
| 404 | Not found | Unknown event or order |
| 409 | Conflict | Seat is no longer available |
| 429 | Too many requests | Rate limit exceeded |
| 500 | Internal server error | Unexpected application failure |
| 503 | Service unavailable | Reservation service temporarily overloaded |

---

## 4. Data Model

TicketHub uses PostgreSQL because ticket sales require reliable transactions, relational integrity, unique constraints, and consistent updates to inventory.

### 4.1 Core Tables

#### Table 1: `users`

Stores registered accounts.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | Primary key | Unique user ID |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login and contact address |
| password_hash | TEXT | NOT NULL | Secure password hash |
| created_at | TIMESTAMPTZ | NOT NULL | Account creation time |

Passwords are stored as secure hashes, never as plaintext.

#### Table 2: `events`

Stores event details.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | Primary key | Unique event ID |
| name | VARCHAR(255) | NOT NULL | Event name |
| venue | VARCHAR(255) | NOT NULL | Venue name |
| starts_at | TIMESTAMPTZ | NOT NULL | Event start time |
| status | VARCHAR(20) | NOT NULL | Draft, on sale, or cancelled |
| created_at | TIMESTAMPTZ | NOT NULL | Creation time |

The database should restrict status values to an explicitly defined set.

#### Table 3: `seats`

Stores event-specific sellable seats.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | Primary key | Unique seat inventory ID |
| event_id | UUID | NOT NULL, foreign key to events.id | Associated event |
| seat_label | VARCHAR(50) | NOT NULL | Seat label |
| price | NUMERIC(12,2) | NOT NULL, CHECK (price >= 0) | Ticket price |
| status | VARCHAR(20) | NOT NULL | Available, held, or sold |

A unique constraint on `(event_id, seat_label)` prevents duplicate seat labels within an event.

#### Table 4: `orders`

Stores purchase attempts and outcomes.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | Primary key | Unique order ID |
| user_id | UUID | NOT NULL, foreign key to users.id | Customer |
| status | VARCHAR(30) | NOT NULL | Pending payment, confirmed, expired, cancelled, or refunded |
| total_amount | NUMERIC(12,2) | NOT NULL, CHECK (total_amount >= 0) | Amount due |
| currency | CHAR(3) | NOT NULL | Currency code |
| idempotency_key | VARCHAR(255) | NOT NULL | Identifies retried requests |
| created_at | TIMESTAMPTZ | NOT NULL | Order creation time |

A unique constraint on `(user_id, idempotency_key)` prevents duplicate order creation for the same user's logical request.

The server calculates the amount. Purchased item prices should be preserved as historical snapshots so that later price changes do not alter past orders.

#### Table 5: `seat_holds`

Stores temporary reservations.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | Primary key | Unique hold ID |
| user_id | UUID | NOT NULL, foreign key to users.id | Hold owner |
| expires_at | TIMESTAMPTZ | NOT NULL | Expiration time |
| status | VARCHAR(20) | NOT NULL | Active, converted, expired, or cancelled |
| idempotency_key | VARCHAR(255) | NOT NULL | Prevents duplicate holds |
| created_at | TIMESTAMPTZ | NOT NULL | Creation time |

A unique constraint on `(user_id, idempotency_key)` prevents duplicate logical hold creation.

#### Table 6: `seat_hold_items`

Connects holds to the seats they reserve.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| hold_id | UUID | Primary key component, foreign key to seat_holds.id | Associated hold |
| seat_id | UUID | Primary key component, foreign key to seats.id | Reserved seat |

The composite primary key `(hold_id, seat_id)` prevents duplicate seat entries within one hold.

#### Table 7: `order_items`

Connects orders to purchased seats.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| order_id | UUID | Primary key component, foreign key to orders.id | Associated order |
| seat_id | UUID | NOT NULL, UNIQUE, foreign key to seats.id | Purchased seat |
| unit_price | NUMERIC(12,2) | NOT NULL, CHECK (unit_price >= 0) | Historical purchase price |

The composite primary key `(order_id, seat_id)` prevents duplicate seat entries within one order.

The unique constraint on `seat_id` prevents the same event-specific seat inventory record from appearing in two different orders. This assumes each `seats` record represents one physical seat for one event.

#### Table 8: `payments`

Stores payment attempts and provider references.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | Primary key | Unique payment ID |
| order_id | UUID | NOT NULL, foreign key to orders.id | Associated order |
| provider_reference | VARCHAR(255) | UNIQUE | Provider payment reference |
| amount | NUMERIC(12,2) | NOT NULL, CHECK (amount >= 0) | Payment amount |
| currency | CHAR(3) | NOT NULL | Currency code |
| status | VARCHAR(20) | NOT NULL | Pending, succeeded, failed, or refunded |
| created_at | TIMESTAMPTZ | NOT NULL | Creation time |

Provider webhook event identifiers must also be stored with a uniqueness constraint, either in this table or in a separate webhook-events table.

#### Table 9: `tickets`

Stores issued tickets.

| Column | Type | Constraints | Purpose |
|---|---|---|---|
| id | UUID | Primary key | Unique ticket ID |
| order_id | UUID | NOT NULL, foreign key to orders.id | Confirmed order |
| seat_id | UUID | NOT NULL, UNIQUE, foreign key to seats.id | Assigned seat |
| status | VARCHAR(20) | NOT NULL | Valid, cancelled, or used |
| issued_at | TIMESTAMPTZ | NOT NULL | Issue time |

A unique constraint on `seat_id` prevents multiple ticket records for the same seat.

Tickets are created only after successful order confirmation.

### 4.2 Relationships

- One user can have many orders.
- One user can create many seat holds.
- One event has many seats.
- Each seat inventory record belongs to one event.
- One hold can contain multiple seats through `seat_hold_items`.
- One order can contain multiple seats through `order_items`.
- One order can have multiple payment attempts.
- A seat can have at most one order item because `order_items.seat_id` is unique.
- A seat can have at most one issued ticket because `tickets.seat_id` is unique.

The hold and purchase relationships represent different stages of the booking lifecycle. The system must safely transition seats from held to sold or release them after expiration.

### 4.3 Relationship Diagram

```text
USERS (1) --------< ORDERS (many)
  |                    |
  |                    +--------< ORDER_ITEMS >-------- SEATS
  |                    |                                  |
  |                    +--------< PAYMENTS                |
  |                    |                                  |
  |                    +--------< TICKETS >---------------+
  |
  +----------------< SEAT_HOLDS
                         |
                         +--------< SEAT_HOLD_ITEMS >----- SEATS

EVENTS (1) --------< SEATS (many)
```

The arrows represent relationships enforced through foreign keys. Unique constraints additionally restrict how seats can be assigned to orders and tickets.

### 4.4 Indexes

Recommended indexes include:

- `events(status, starts_at)` for published upcoming events.
- `seats(event_id, status)` for seat availability queries.
- `seat_holds(expires_at, status)` for expired-hold processing.
- `orders(user_id, created_at)` for order history.
- `payments(order_id, status)` for payment lookups.
- Unique indexes on `(event_id, seat_label)`, `order_items.seat_id`, and `tickets.seat_id`.

Indexes improve read performance but add storage and write overhead. They should be validated against actual query patterns.

---

## 5. Preventing Double-Booking

### 5.1 The Problem

Suppose Alice and Brian both see seat A-12 displayed as available.

Both submit reservation requests at almost the same time.

A naive implementation might:

1. Check that the seat is available.
2. Return an available result to both users.
3. Create a hold for Alice.
4. Create another hold for Brian.

This is a race condition. The initial availability checks do not prevent the seat from changing before a reservation is written.

### 5.2 Atomic Conditional Updates

TicketHub changes a seat from available to held only if it is still available.

Illustrative SQL:

```sql
UPDATE seats
SET status = 'held'
WHERE id = :seat_id
  AND status = 'available';
```

The application checks the number of affected rows.

- One affected row means the seat was successfully changed to held.
- Zero affected rows means the seat was not available for this operation.

When two users attempt the update concurrently, PostgreSQL coordinates conflicting writes to the same row. Only one transaction can successfully perform the available-to-held transition.

A previous availability check is not sufficient. The availability condition must be part of the write operation.

### 5.3 Database Transactions

A hold can involve several seat updates, a hold record, and multiple `seat_hold_items` records.

These operations must succeed or fail together.

Illustrative transaction:

```sql
BEGIN;

-- Conditionally update each requested seat.
-- Verify that every requested seat was successfully held.
-- Roll back if any seat is unavailable.

-- Insert the seat_holds record.
-- Insert the associated seat_hold_items records.

COMMIT;
```

This is illustrative pseudocode, not a complete executable implementation.

If a user requests three seats and one is unavailable, the system rolls back the transaction so that the other two are not left partially reserved.

For multiple-seat requests, the implementation should update seats in a consistent order and verify that every requested seat was successfully reserved before committing.

### 5.4 Database Constraints

Application checks alone are not sufficient.

The database enforces:

- A unique `(event_id, seat_label)` in `seats`.
- A unique `seat_id` in `order_items`.
- A unique `seat_id` in `tickets`.
- Appropriate primary keys and foreign keys.
- Valid price and amount constraints.

The unique constraint on `order_items.seat_id` prevents the same seat from appearing in two different orders.

The unique constraint on `tickets.seat_id` prevents duplicate ticket issuance for the same seat.

A transaction that violates a uniqueness constraint fails rather than producing an invalid duplicate assignment.

### 5.5 Seat State Transitions

A seat moves through the following lifecycle:

```text
AVAILABLE
    |
    | Successful atomic reservation
    v
HELD
    |
    | Payment verified and order confirmed
    v
SOLD
```

An expired hold follows this path:

```text
HELD
    |
    | Hold expires without a completed purchase
    v
AVAILABLE
```

The expiration worker must not blindly release a seat based only on an old timestamp.

It must atomically verify that the hold is still active, has expired according to the database clock, and has not been converted into a confirmed purchase.

Payment confirmation and hold expiration must follow compatible locking and state-transition rules.

### 5.6 Payment Confirmation

The payment provider operates outside TicketHub's database transaction. TicketHub therefore cannot keep a database transaction open while waiting for a customer to complete payment.

The process is:

1. Create an order associated with a valid hold.
2. Initiate payment through the provider.
3. Receive a verified payment notification or check the provider's authoritative payment status.
4. Begin a database transaction.
5. Verify the payment, order, hold, expiry, and seat state.
6. Confirm the order and mark the seats as sold only if the required conditions still hold.
7. Create ticket records.
8. Commit the transaction.

If payment succeeds after a hold expires and the seat is reassigned, the system must not confirm a conflicting ticket. It must reconcile the payment using an appropriate cancellation or refund process.

A reconciliation process should also detect cases where payment succeeds but the application fails before recording the confirmation.

### 5.7 Idempotency

An operation is idempotent when repeating the same logical request does not create additional effects.

If a reservation request times out and the client retries, the idempotency key allows TicketHub to return the existing result instead of creating a second hold.

Payment notifications may also be delivered repeatedly. Unique provider-event identifiers and idempotent order-confirmation logic prevent duplicate ticket issuance.

### 5.8 Correctness Guarantee

TicketHub relies on the combination of:

- Atomic conditional updates.
- Database transactions.
- Unique constraints.
- Explicit hold, order, payment, and ticket states.
- Idempotent requests and webhook processing.
- Safe coordination between payment confirmation and hold expiration.

Even when many users request the same seat simultaneously, the database must permit only one valid reservation and at most one confirmed ticket for that seat.

---

## 6. System Architecture

### 6.1 Architecture Diagram

```text
                    +----------------------+
                    | Customers            |
                    | Web / Mobile UI      |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    | CDN + Web Firewall   |
                    | Static Asset Cache   |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    | Load Balancer        |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    | Virtual Waiting Room |
                    | Rate Limiting        |
                    +----------+-----------+
                               |
                               v
                    +----------------------+
                    | Stateless API        |
                    | Application Instances|
                    +----------+-----------+
                               |
               +---------------+----------------+
               |               |                |
               v               v                v
      +----------------+ +-------------+ +----------------+
      | Event Read     | | Reservation | | Order / Payment|
      | Cache          | | Service     | | Service        |
      +--------+-------+ +------+------+ +--------+-------+
               |                |                 |
               |                +--------+--------+
               |                         |
               v                         v
      +----------------+       +----------------------+
      | PostgreSQL     |       | External Payment     |
      | Primary DB     |       | Provider             |
      +--------+-------+       +----------+-----------+
               |                          |
               v                          v
      +----------------+       +----------------------+
      | Backups and    |       | Verified Webhook and |
      | Recovery       |       | Reconciliation       |
      +----------------+       +----------+-----------+
                                          |
                                          v
                                 +----------------------+
                                 | Order / Payment      |
                                 | Processing           |
                                 +----------------------+

                    +--------------------------+
                    | Background Workers        |
                    | Hold Expiry, Monitoring   |
                    | Logs, Metrics, Alerts     |
                    +--------------------------+
```

### 6.2 Component Explanations

#### 1. Web or Mobile UI

Allows users to browse events, select seats, pay, and retrieve tickets.

The interface displays waiting-room status, hold-expiry times, and purchase outcomes. The client is never trusted to determine the authoritative seat or payment state.

#### 2. Content Delivery Network

Serves static files and public event images close to users, reducing load on application servers.

#### 3. Web Application Firewall

Filters suspicious traffic and helps protect against common web attacks. It supplements application-level security rather than replacing it.

#### 4. Load Balancer

Distributes requests across healthy application instances. Stateless application instances can be added or removed without requiring users to remain attached to one server.

#### 5. Virtual Waiting Room

Regulates the rate at which users enter the critical purchase flow.

A queue or admission-token mechanism prevents all 200,000 prospective buyers from overwhelming the reservation service simultaneously. Tokens must be validated server-side, and rate limits should help prevent abuse.

The waiting room controls admission but does not increase the number of available seats.

#### 6. API Application Instances

Authenticate users, validate requests, enforce authorization, expose the API, and coordinate the application's services.

Horizontal scaling increases request-processing capacity, but it does not remove database contention. Reservation correctness still depends on transactional inventory operations.

#### 7. Event Read Cache

Stores frequently requested public event details and suitable read data.

Caching reduces repeated database queries. Cached seat availability is advisory only; the reservation service must validate the current seat state against the authoritative database.

#### 8. Reservation Service

Processes seat holds and releases expired holds.

It uses atomic conditional updates, transactions, and database constraints to protect inventory against concurrent requests.

#### 9. Order and Payment Service

Creates orders, calculates amounts, initiates payments, verifies payment results, and confirms completed purchases.

It uses explicit states and idempotency to prevent duplicate orders and ticket issuance.

#### 10. PostgreSQL Primary Database

Stores users, events, seats, holds, orders, order items, payments, and tickets.

It is the authoritative source for seat ownership and purchase state. Transactions, conditional updates, and unique constraints protect inventory.

The primary database must be load-tested for the contention expected during major sales.

#### 11. External Payment Provider

Processes customer payments. TicketHub stores payment references and statuses rather than raw payment credentials.

Verified notifications and reconciliation processes handle delayed or duplicated payment results.

#### 12. Background Workers

Process expired holds and other asynchronous tasks.

Workers must use safe transactional state changes and idempotent processing so that repeated execution does not corrupt inventory.

#### 13. Monitoring and Alerts

Tracks request rates, response times, error rates, queue depth, database contention, hold failures, payment outcomes, and ticket issuance.

Alerts help operators detect overload and payment inconsistencies.

#### 14. Backups and Recovery

Regular backups and tested recovery procedures protect against data loss and corruption.

Replication can support recovery or read scaling, but asynchronous replicas may lag behind the primary. Reservation decisions must use an authoritative, sufficiently current transactional source.

Replication is not a substitute for backups.

### 6.3 Handling the Popular Sale

**Step 1: Reduce unnecessary requests.**

The CDN serves static assets, while cached event information reduces database reads.

**Step 2: Control admission.**

The virtual waiting room releases users into the purchase flow at a rate determined by tested system capacity.

**Step 3: Scale request processing.**

Multiple stateless API instances process admitted requests, with a load balancer distributing traffic across healthy instances.

**Step 4: Protect inventory.**

The reservation service uses conditional updates, transactions, and unique constraints. Conflicting requests cannot both successfully reserve the same seat.

**Step 5: Isolate payment delays.**

External payment calls do not keep database transactions open. Verified notifications and reconciliation workers process payment results safely.

**Step 6: Monitor capacity.**

Monitoring tracks queue depth, latency, database contention, and payment errors. Admission rates can be reduced when critical services approach their tested limits.

**Step 7: Recover safely.**

Backups, recovery procedures, and reconciliation jobs help restore service and resolve interrupted operations without issuing duplicate tickets.

The design does not assume unlimited capacity. It provides controlled access while preserving correctness when demand exceeds available seats or processing capacity.

---

## 7. Trade-Offs

### Trade-Off 1: Strong Consistency Versus Maximum Write Throughput

**Decision:** Use PostgreSQL transactions and constraints as the authority for seat reservations and purchases.

**Advantages:**

- Prevents conflicting seat assignments.
- Keeps related inventory and order changes consistent.
- Enforces integrity rules at the database level.
- Provides a clear source of truth for purchases.

**Disadvantages:**

- Concurrent requests for the same seat can cause lock contention.
- Transactional writes require coordination.
- The primary database may become a bottleneck during a major sale.

**Alternative:** Partition inventory ownership or introduce a dedicated reservation system.

**Justification:** Inventory correctness is more important than accepting every request immediately. Caching and admission control reduce database pressure without weakening the core booking guarantees.

### Trade-Off 2: Short Holds Versus Customer Convenience

**Decision:** Use short-lived holds, initially five minutes, subject to testing and business requirements.

**Advantages:**

- Prevents abandoned reservations from blocking seats indefinitely.
- Returns unused inventory to other customers.
- Supports faster inventory turnover during popular sales.

**Disadvantages:**

- Customers may lose reservations when payments are slow.
- Late payment notifications create reconciliation work.
- Hold expiry requires careful coordination with payment confirmation.

**Alternative:** Use longer holds or faster payment methods.

**Justification:** High-demand sales require efficient inventory turnover, but the system must clearly communicate deadlines and safely handle late payments.

### Trade-Off 3: Caching Versus Fresh Availability

**Decision:** Cache public event information aggressively but treat cached seat availability as advisory.

**Advantages:**

- Reduces database load.
- Improves response times.
- Absorbs sudden increases in browsing traffic.

**Disadvantages:**

- Cached availability can become outdated.
- Users may see a seat as available when another customer has already reserved it.
- Cache invalidation introduces complexity.

**Alternative:** Query the database for every availability request.

**Justification:** Slightly stale displayed availability is acceptable if every actual reservation is validated transactionally against the authoritative database. A conflicting confirmed purchase is not acceptable.

### Trade-Off 4: Waiting Room Versus Immediate Access

**Decision:** Use a virtual waiting room for high-demand sales.

**Advantages:**

- Controls the request rate reaching the reservation service.
- Reduces the risk of overwhelming the database.
- Provides an orderly admission process.

**Disadvantages:**

- Customers must wait.
- Queue management adds complexity.
- Queue position does not guarantee a ticket when demand exceeds supply.

**Alternative:** Admit everyone immediately and rely on autoscaling and rate limiting.

**Justification:** The sale has approximately ten prospective buyers for every seat. A waiting room improves operational control and can support a transparent access policy.

---

## Conclusion

TicketHub must support routine browsing and concentrated demand for limited ticket inventory.

The proposed architecture uses caching and horizontal scaling for read traffic, a virtual waiting room for controlled admission, and PostgreSQL transactions and constraints for inventory correctness.

A separate payment workflow, idempotent processing, and reconciliation protect against duplicate requests and delayed payment notifications.

The central design principle is that performance mechanisms improve speed, but the authoritative reservation and payment workflow must preserve correctness under concurrency and failure.

Before production use, the design should be validated through load tests, concurrent reservation tests, payment-failure simulations, and recovery exercises.