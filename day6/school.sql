PRAGMA foreign_keys = ON;
CREATE TABLE students (
    student_id INTEGER PRIMARY KEY,
    student_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE
);


CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    course_name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE enrolments (
    enrolment_id INTEGER PRIMARY KEY,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    grade TEXT,

    FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    FOREIGN KEY (course_id)
        REFERENCES courses(course_id),

    UNIQUE (student_id, course_id)
);

INSERT INTO students (student_id, student_name, email)
VALUES
    (1, 'Favour Kamau', 'favour@example.com'),
    (2, 'Brian Otieno', 'brian@example.com'),
    (3, 'Carol Njeri', 'carol@example.com'),
    (4, 'David Mwangi', 'david@example.com');

   
INSERT INTO courses (course_id, course_name, description)
VALUES
    (1, 'Database Systems', 'Introduction to relational databases'),
    (2, 'Web Development', 'Building websites with HTML, CSS and JavaScript'),
    (3, 'Computer Networking', 'Introduction to computer networks');

  
INSERT INTO enrolments (enrolment_id, student_id, course_id, grade)
VALUES
    (1, 1, 1, 'A'),
    (2, 1, 2, 'B'),
    (3, 2, 1, 'B'),
    (4, 2, 3, 'A'),
    (5, 3, 2, 'A');

    -- Query 1: Find all courses for one student by name
SELECT
    students.student_name,
    courses.course_name,
    enrolments.grade
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE students.student_name = 'Favour Kamau';

-- Query 2: Find all students enrolled in one course
SELECT
    students.student_name,
    courses.course_name,
    enrolments.grade
FROM students
JOIN enrolments
    ON students.student_id = enrolments.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE courses.course_name = 'Database Systems';

-- Query 3: Count students per course
SELECT
    courses.course_name,
    COUNT(enrolments.student_id) AS number_of_students
FROM courses
LEFT JOIN enrolments
    ON courses.course_id = enrolments.course_id
GROUP BY
    courses.course_id,
    courses.course_name
ORDER BY
    courses.course_name;

    -- Query 4: Find students with no enrolments
SELECT
    students.student_id,
    students.student_name,
    students.email
FROM students
LEFT JOIN enrolments
    ON students.student_id = enrolments.student_id
WHERE enrolments.enrolment_id IS NULL;


-- Query 5: Update Alice's grade for Database Systems
UPDATE enrolments
SET grade = 'A+'
WHERE enrolment_id = 1;

SELECT
    students.student_name,
    courses.course_name,
    enrolments.grade
FROM enrolments
JOIN students
    ON enrolments.student_id = students.student_id
JOIN courses
    ON enrolments.course_id = courses.course_id
WHERE enrolments.enrolment_id = 1;