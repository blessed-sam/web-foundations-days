# SnapShare Photo App Scaling Plan

## 1. Assumptions

SnapShare is a photo-sharing application where users upload photos
and view feed pages containing photos from people they follow.

The following assumptions are used for this scaling plan:

- Registered users: 10,000,000.
- Daily active users: 10% of registered users.
- Each daily active user uploads 1 photo per day.
- Each daily active user views 50 feed pages per day.
- Average original photo size: 2 MB.
- Average thumbnail size: 50 KB.
- Seconds per day: 86,400.
- Days per year: 365.
- Peak feed traffic is 5 times average traffic.
- Each uploaded photo generates one thumbnail.
- Average traffic is calculated across 24 hours.
- Storage estimates exclude backups, database overhead, replication,
  and other additional storage requirements.
- Decimal storage units are used: 1 TB = 1,000 GB.

## 2. Capacity Calculations

### 2.1 Daily Active Users

Daily active users = Registered users × Daily active percentage

= 10,000,000 × 0.10

= 1,000,000 daily active users.

### 2.2 Photo Uploads Per Second

Daily uploads = Daily active users × Photos per user per day

= 1,000,000 × 1

= 1,000,000 uploads per day.

Average uploads per second = Daily uploads ÷ Seconds per day

= 1,000,000 ÷ 86,400

≈ 11.57 uploads per second.

Therefore, SnapShare averages approximately 11.57 photo uploads
per second.

### 2.3 Feed Views Per Second

Daily feed views = Daily active users × Feed pages per user per day

= 1,000,000 × 50

= 50,000,000 feed views per day.

Average feed views per second = Daily feed views ÷ Seconds per day

= 50,000,000 ÷ 86,400

≈ 578.70 feed views per second.

Peak feed views per second = Average feed views per second × 5

= 578.70 × 5

≈ 2,893.52 feed views per second.

Therefore:

- Average feed traffic: approximately 579 views per second.
- Peak feed traffic: approximately 2,894 views per second.

### 2.4 Annual Photo Storage

Daily original photo storage:

= 1,000,000 photos × 2 MB

= 2,000,000 MB

= 2 TB per day.

Annual original photo storage:

= 2 TB × 365

= 730 TB per year.

Daily thumbnail storage:

= 1,000,000 thumbnails × 50 KB

= 50,000,000 KB

= 50 GB per day.

Annual thumbnail storage:

= 50 GB × 365

= 18,250 GB

= 18.25 TB per year.

Total estimated storage:

| Storage category | Daily storage | Annual storage |
|---|---:|---:|
| Original photos | 2 TB | 730 TB |
| Thumbnails | 50 GB | 18.25 TB |
| Total | 2.05 TB | 748.25 TB |

SnapShare therefore requires approximately 730 TB of storage per year
for original photos and 18.25 TB per year for thumbnails.

These figures assume that uploaded images are retained throughout
the year and exclude backups, replication, and other overhead.

## 3. Read-Heavy or Write-Heavy?

SnapShare is a read-heavy system because users view feed pages much
more frequently than they upload photos.

The system receives 50,000,000 feed views and 1,000,000 photo uploads
per day, giving approximately 50 feed views for every upload.

The design should therefore prioritize efficient read performance
through caching, CDN delivery, and database read replicas.

Uploads should also remain responsive, so thumbnail generation is
handled asynchronously using a message queue and background worker.

## 4. Why Photos Should Not Be Stored Inside the Database

Original photos and thumbnails should be stored in object storage
instead of being stored directly as binary files inside the database.

Photo files are large and can consume substantial database storage,
increase backup requirements, and add unnecessary pressure to
database operations.

The database should store structured metadata such as the photo ID,
user ID, caption, upload timestamp, original object key, thumbnail
object key, and processing status.

Object storage holds the actual photo files, while the database
manages the information needed to identify and organize them.

## 5. Architecture Diagram

```text
                         SNAPSHARE ARCHITECTURE

                              USERS
                                |
                                v
                         +--------------+
                         |     CDN      |
                         | Photos and   |
                         | thumbnails   |
                         +--------------+
                                |
                                v
                         +--------------+
                         | Load Balancer|
                         +--------------+
                                |
                                v
                    +-----------------------+
                    |   Application Servers |
                    |                       |
                    | Uploads and Feed API  |
                    +-----------------------+
                         |      |       |
             +-----------+      |       +----------------+
             |                  |                        |
             v                  v                        v
      +-------------+    +-------------+         +---------------+
      |    Cache    |    |   Primary   |         | Object Storage|
      |             |    |   Database  |         |               |
      | Feed data   |    |             |         | Original      |
      | and metadata|    | Photo data  |         | photos        |
      +-------------+    +-------------+         | Thumbnails    |
                               |                 +---------------+
                               v                        ^
                      +----------------+                |
                      | Read Replica   |                |
                      |                |                |
                      | Read queries   |                |
                      +----------------+                |
                                                        |
                 +----------------+                     |
                 | Message Queue  |                     |
                 |                |                     |
                 | Thumbnail jobs |                     |
                 +----------------+                     |
                          |                             |
                          v                             |
                 +----------------+                     |
                 | Thumbnail      |---------------------+
                 | Worker         |
                 +----------------+
```

## 6. Architecture Components and Their Purposes

- **CDN:** Serves cached photos and thumbnails from locations closer
  to users, reducing latency and traffic to the origin infrastructure.

- **Load balancer:** Distributes incoming application requests across
  multiple application servers to prevent one server from becoming
  overloaded.

- **Application servers:** Process API requests, authenticate users,
  validate uploads, and coordinate database, cache, queue, and
  object storage operations.

- **Cache:** Stores frequently requested feed data and metadata to
  reduce repeated database queries and improve response times.

- **Primary database:** Stores structured application data, including
  user records, photo metadata, and follow relationships, and handles
  database writes.

- **Database read replica:** Serves eligible read queries to reduce
  read traffic on the primary database.

- **Object storage:** Stores original photos and generated thumbnails
  separately from the structured database records.

- **Message queue:** Holds thumbnail-generation jobs so image
  processing can happen asynchronously without delaying the upload
  request until processing finishes.

- **Thumbnail worker:** Retrieves thumbnail jobs, generates smaller
  images, stores them in object storage, and updates photo processing
  status in the database.

## 7. Photo Upload Flow

1. A user selects a photo and submits an upload request to SnapShare.

2. The load balancer directs the application request to an available
   application server.

3. The application server authenticates the user and validates the
   file type, size, and other upload requirements.

4. The application server stores the original photo in object
   storage and obtains its storage key.

5. The application server saves the photo metadata in the primary
   database, including the photo ID, user ID, caption, upload time,
   original storage key, and processing status.

6. The application server places a thumbnail-generation job in the
   message queue.

7. After the original photo and essential metadata are safely stored
   and the job has been accepted, the application acknowledges the
   upload to the user.

8. The thumbnail worker retrieves the queued job and reads the
   original photo from object storage.

9. The worker generates a smaller thumbnail and stores it in object
   storage under a separate key.

10. The worker updates the database with the thumbnail key and marks
    thumbnail processing as complete.

11. When users request the photo or thumbnail, the CDN serves a
    cached copy when available or retrieves the image through its
    configured origin path.

The queue allows thumbnail generation to happen independently of the
upload request. Failed jobs should be retried, and the system should
handle duplicate job delivery safely.

## 8. Design Trade-Offs

### 8.1 Caching Versus Data Freshness

Caching feed data reduces database queries and improves response
times, but cached information may become outdated after a user uploads
a photo or follows another user.

Cache expiration policies and invalidation mechanisms can reduce
this problem, but they add complexity.

### 8.2 Asynchronous Thumbnail Generation Versus Immediate Availability

A message queue allows uploads to finish without waiting for thumbnail
generation, improving responsiveness.

However, thumbnails may not be immediately available after upload.

The application can track processing status and display the original
image or a placeholder until the thumbnail is ready.

### 8.3 Read Replicas Versus Immediate Consistency

Database read replicas distribute read traffic and reduce pressure
on the primary database.

However, replication delays can cause a recent update to be missing
temporarily from replica queries.

Reads that require immediate consistency can be directed to the
primary database, while other reads use replicas.

### 8.4 CDN Performance Versus Cache Management Complexity

A CDN reduces image delivery latency and repeated requests to the
origin infrastructure.

However, CDN usage introduces additional costs and cache management
complexity.

Versioned image URLs and appropriate cache-control policies can make
image caching more reliable.

## 9. Conclusion

SnapShare has 1,000,000 daily active users, approximately 11.57 photo
uploads per second, approximately 579 average feed views per second,
and approximately 2,894 peak feed views per second.

The application needs approximately 730 TB of original photo storage
and 18.25 TB of thumbnail storage per year.

Because SnapShare is read-heavy, the architecture uses a CDN, cache,
and database read replica to improve read performance. Object storage
holds image files, while a message queue and thumbnail worker handle
image processing asynchronously.

This architecture provides a starting point for scaling SnapShare,
although production deployment would also require monitoring,
security controls, backups, failure recovery, and capacity testing.