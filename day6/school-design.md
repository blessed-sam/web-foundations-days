# School Database Design

## 1. Table Descriptions

### Students

The students table stores information about each student, including
their unique student ID, name and email address. The student ID is
the primary key used to identify each student. The email column is
required and has a UNIQUE constraint to prevent two students from
registering with the same email address.

### Courses

The courses table stores information about the courses offered by
the school. Each course has a unique course ID, a course name and
an optional description. The course ID is the primary key, while
the course name is required and unique.

### Enrolments

The enrolments table records which students are enrolled in which
courses and the grade associated with each enrolment. It has its
own primary key, enrolment_id, and two foreign keys: student_id
references students(student_id), while course_id references
courses(course_id). The UNIQUE constraint on student_id and
course_id prevents the same student from enrolling in the same
course more than once. The grade can be NULL because a student
may not have received a grade yet.

## 2. Relationships

The relationship between students and enrolments is one-to-many
because one student can have multiple enrolments, while each
enrolment belongs to one student. The relationship between courses
and enrolments is also one-to-many because one course can have
multiple enrolments, while each enrolment refers to one course.

Students and courses have a many-to-many relationship. One student
can enrol in several courses, and one course can have several
students. The enrolments table acts as a join table between
students and courses. It is needed to represent this relationship
without storing repeating course columns in the students table or
repeating student columns in the courses table. It also stores
information specific to each student-course combination, such as
the grade.

## 3. Index

I would add an index on enrolments(course_id) to help the database
find enrolments for a particular course more efficiently. This is
useful when retrieving all students enrolled in a course or
calculating the number of students per course. Although the UNIQUE
constraint on (student_id, course_id) creates a composite index
in SQLite, that index begins with student_id, so a separate index
on course_id can improve queries that search by course_id alone.

The index could be created using:

CREATE INDEX idx_enrolments_course_id
ON enrolments(course_id);

## 4. SQL or NoSQL?

I would choose a relational SQL database for this school system.
Students, courses and enrolments have clear relationships, and
the system needs to maintain data integrity through primary keys,
foreign keys and uniqueness constraints. SQL also makes it
straightforward to join tables, count enrolments and update grades.
A relational database such as SQLite is suitable for this learning
assignment and a small application. If the school system grows
and requires multiple users, concurrent access and a database
server, PostgreSQL would be a suitable option. NoSQL could be
useful for some applications with flexible or highly varied data
structures, but it is not necessary for this system's requirements.