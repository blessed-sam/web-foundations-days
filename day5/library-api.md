# Library Books REST API

## Overview

The Library Books API allows clients to retrieve, create, update,
and delete books in a library system.

The API uses REST principles and HTTP methods to operate on
the books resource.

Example base URL:

`https://api.example.com`

---

## 1. List All Books

- **Method:** GET
- **Path:** `/books`
- **Description:** Retrieves a list of all books in the library.
- **Request body:** None
- **Success status code:** `200 OK`

### Example request

`GET /books`

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