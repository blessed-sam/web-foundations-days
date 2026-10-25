# Library Books REST API

## Overview

The Library Books REST API allows users to retrieve, create, update,
and delete books in a library system.

The API follows REST principles and uses HTTP methods to perform
operations on the books resource.

**Base URL:** `https://api.example.com`

---

## 1. List All Books

- **Method:** GET
- **Endpoint:** `/books`
- **Description:** Retrieves a list of all books in the library.
- **Request body:** None
- **Success status code:** `200 OK`

### Example request

```http
GET /books
```

### Example response

```json
[
  {
    "id": 1,
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "publishedYear": 1958
  },
  {
    "id": 2,
    "title": "The River Between",
    "author": "Ngugi wa Thiong'o",
    "publishedYear": 1965
  }
]
```

---

## 2. Get One Book

- **Method:** GET
- **Endpoint:** `/books/{id}`
- **Description:** Retrieves a single book using its unique ID.
- **Request body:** None
- **Success status code:** `200 OK`

### Example request

```http
GET /books/1
```

### Example response

```json
{
  "id": 1,
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958
}
```

---

## 3. Create a Book

- **Method:** POST
- **Endpoint:** `/books`
- **Description:** Creates a new book in the library.
- **Request body:** Required
- **Success status code:** `201 Created`

### Example request

```http
POST /books
Content-Type: application/json

{
  "title": "The River Between",
  "author": "Ngugi wa Thiong'o",
  "publishedYear": 1965
}
```

### Example response

```json
{
  "id": 3,
  "title": "The River Between",
  "author": "Ngugi wa Thiong'o",
  "publishedYear": 1965
}
```

The server assigns a unique ID to the newly created book.

---

## 4. Update a Book

- **Method:** PUT
- **Endpoint:** `/books/{id}`
- **Description:** Replaces the details of an existing book.
- **Request body:** Required
- **Success status code:** `200 OK`

### Example request

```http
PUT /books/1
Content-Type: application/json

{
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958
}
```

### Example response

```json
{
  "id": 1,
  "title": "Things Fall Apart",
  "author": "Chinua Achebe",
  "publishedYear": 1958
}
```

The ID identifies the book to update. The request body contains
the replacement book details.

---

## 5. Delete a Book

- **Method:** DELETE
- **Endpoint:** `/books/{id}`
- **Description:** Deletes a book using its unique ID.
- **Request body:** None
- **Success status code:** `204 No Content`

### Example request

```http
DELETE /books/1
```

### Example response

A successful response has status `204 No Content` and contains
no response body.

---

## 6. List Books by Author

- **Method:** GET
- **Endpoint:** `/books?author={authorName}`
- **Description:** Retrieves books written by the specified author.
- **Request body:** None
- **Success status code:** `200 OK`

### Example request

```http
GET /books?author=Chinua%20Achebe
```

### Example response

```json
[
  {
    "id": 1,
    "title": "Things Fall Apart",
    "author": "Chinua Achebe",
    "publishedYear": 1958
  }
]
```

The `author` query parameter specifies which author's books
should be returned.

The value `Chinua%20Achebe` contains `%20`, which represents
a space in the URL.

If no books match the author, the API can return `200 OK`
with an empty array.

---

## Error Responses

### 400 Bad Request

- **Meaning:** The request contains invalid data or cannot be
  processed because of a client-side input error.
- **Example:** A client attempts to create a book without a
  required title or supplies a published year in an invalid format.
- **Expected response:** `400 Bad Request`

### 404 Not Found

- **Meaning:** The requested resource does not exist.
- **Example:** A client requests `GET /books/999`, but no book
  with ID `999` exists.
- **Expected response:** `404 Not Found`