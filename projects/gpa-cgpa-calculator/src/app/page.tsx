"use client";

import { useState } from "react";

type Grade = "A" | "B" | "C" | "D" | "E" | "F";

type Course = {
  id: number;
  name: string;
  code: string;
  credits: number;
  grade: Grade;
};

const gradePoints: Record<Grade, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

export default function Home() {
  const [studentName, setStudentName] = useState("");
  const [semester, setSemester] = useState("First Semester");
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [grade, setGrade] = useState<Grade>("A");
  const [error, setError] = useState("");

  const totalCredits = courses.reduce(
    (total, course) => total + course.credits,
    0,
  );

  const totalWeightedPoints = courses.reduce(
    (total, course) => total + course.credits * gradePoints[course.grade],
    0,
  );

  const gpa = totalCredits > 0 ? totalWeightedPoints / totalCredits : 0;

  function addCourse() {
    const parsedCredits = Number(credits);

    if (!courseName.trim() || !courseCode.trim()) {
      setError("Please enter both the course name and course code.");
      return;
    }

    if (!Number.isFinite(parsedCredits) || parsedCredits <= 0) {
      setError("Credit units must be greater than zero.");
      return;
    }

    const newCourse: Course = {
      id: Date.now(),
      name: courseName.trim(),
      code: courseCode.trim().toUpperCase(),
      credits: parsedCredits,
      grade,
    };

    setCourses((currentCourses) => [...currentCourses, newCourse]);
    setCourseName("");
    setCourseCode("");
    setCredits("3");
    setGrade("A");
    setError("");
  }

  function removeCourse(id: number) {
    setCourses((currentCourses) =>
      currentCourses.filter((course) => course.id !== id),
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1120] text-slate-100">
      <nav className="border-b border-slate-800 px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold">
            Grade<span className="text-blue-400">Track</span>
          </h1>
          <span className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
            GPA Calculator
          </span>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-400">
            Academic dashboard
          </p>
          <h2 className="text-3xl font-bold sm:text-5xl">
            Track your academic progress.
          </h2>
          <p className="mt-4 max-w-2xl text-slate-400">
            Calculate your GPA, monitor your CGPA, and keep your semester
            results organized in one place.
          </p>
        </div>

        <div className="mb-8 grid gap-6 rounded-2xl border border-slate-800 bg-[#111b2e] p-6 md:grid-cols-2">
          <div>
            <label
              htmlFor="studentName"
              className="mb-2 block text-sm text-slate-300"
            >
              Student name
            </label>
            <input
              id="studentName"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              placeholder="Enter your name"
              className="w-full rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label
              htmlFor="semester"
              className="mb-2 block text-sm text-slate-300"
            >
              Current semester
            </label>
            <select
              id="semester"
              value={semester}
              onChange={(event) => setSemester(event.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#0b1120] px-4 py-3 outline-none focus:border-blue-400"
            >
              <option>First Semester</option>
              <option>Second Semester</option>
              <option>Summer Semester</option>
            </select>
          </div>
        </div>

        <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-6">
            <p className="text-sm text-slate-400">Semester GPA</p>
            <p className="mt-4 text-4xl font-bold">{gpa.toFixed(2)}</p>
            <p className="mt-2 text-sm text-blue-300">Out of 5.00</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111b2e] p-6">
            <p className="text-sm text-slate-400">Cumulative GPA</p>
            <p className="mt-4 text-4xl font-bold">—</p>
            <p className="mt-2 text-sm text-slate-400">
              We'll add multiple semesters next.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#111b2e] p-6">
            <p className="text-sm text-slate-400">Total credit units</p>
            <p className="mt-4 text-4xl font-bold">{totalCredits}</p>
            <p className="mt-2 text-sm text-slate-400">
              Credits entered this semester
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#111b2e] p-6 sm:p-8">
          <h3 className="text-xl font-bold">Add a course</h3>
          <p className="mt-2 text-sm text-slate-400">
            Enter your course details and grade.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="courseName"
                className="mb-2 block text-sm text-slate-300"
              >
                Course name
              </label>
              <input
                id="courseName"
                value={courseName}
                onChange={(event) => setCourseName(event.target.value)}
                placeholder="Mathematics"
                className="w-full rounded-lg border border-slate-700 bg-[#0b1120] px-3 py-3 outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label
                htmlFor="courseCode"
                className="mb-2 block text-sm text-slate-300"
              >
                Course code
              </label>
              <input
                id="courseCode"
                value={courseCode}
                onChange={(event) => setCourseCode(event.target.value)}
                placeholder="MTH101"
                className="w-full rounded-lg border border-slate-700 bg-[#0b1120] px-3 py-3 outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label
                htmlFor="credits"
                className="mb-2 block text-sm text-slate-300"
              >
                Credit units
              </label>
              <input
                id="credits"
                type="number"
                min="0.5"
                step="0.5"
                value={credits}
                onChange={(event) => setCredits(event.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#0b1120] px-3 py-3 outline-none focus:border-blue-400"
              />
            </div>

            <div>
              <label
                htmlFor="grade"
                className="mb-2 block text-sm text-slate-300"
              >
                Grade
              </label>
              <select
                id="grade"
                value={grade}
                onChange={(event) => setGrade(event.target.value as Grade)}
                className="w-full rounded-lg border border-slate-700 bg-[#0b1120] px-3 py-3 outline-none focus:border-blue-400"
              >
                <option value="A">A — 5 points</option>
                <option value="B">B — 4 points</option>
                <option value="C">C — 3 points</option>
                <option value="D">D — 2 points</option>
                <option value="E">E — 1 point</option>
                <option value="F">F — 0 points</option>
              </select>
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={addCourse}
            className="mt-5 rounded-lg bg-blue-500 px-6 py-3 font-semibold text-white transition hover:bg-blue-400"
          >
            + Add course
          </button>

          <div className="mt-10">
            <h3 className="text-lg font-bold">
              {semester} courses ({courses.length})
            </h3>

            {courses.length === 0 ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-700 p-10 text-center">
                <p className="font-medium">No courses added yet</p>
                <p className="mt-2 text-sm text-slate-400">
                  Add your first course above to calculate your GPA.
                </p>
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800/60 text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Course</th>
                      <th className="px-4 py-3">Credits</th>
                      <th className="px-4 py-3">Grade</th>
                      <th className="px-4 py-3">Points</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map((course) => (
                      <tr key={course.id} className="border-t border-slate-800">
                        <td className="px-4 py-4">
                          <p className="font-medium">{course.code}</p>
                          <p className="mt-1 text-slate-400">{course.name}</p>
                        </td>
                        <td className="px-4 py-4">{course.credits}</td>
                        <td className="px-4 py-4">{course.grade}</td>
                        <td className="px-4 py-4">
                          {(course.credits * gradePoints[course.grade]).toFixed(
                            1,
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => removeCourse(course.id)}
                            className="text-red-400 hover:text-red-300"
                            aria-label={`Remove ${course.code}`}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <footer className="py-10 text-center text-sm text-slate-500">
          GradeTrack · Built to help you track your academic progress.
        </footer>
      </section>
    </main>
  );
}
