"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Grade = "A" | "B" | "C" | "D" | "E" | "F";

type Course = {
  id: string;
  name: string;
  code: string;
  credits: number;
  grade: Grade;
  sessionId: string;
  semesterId: string;
  sessionName: string;
  semesterName: string;
};

type Semester = {
  id: string;
  name: string;
  courses: Course[];
};

type Session = {
  id: string;
  name: string;
  semesters: Semester[];
};

type SavedData = {
  studentName: string;
  sessions: Session[];
  selectedSessionId: string;
  selectedSemesterId: string;
};

const STORAGE_KEY_PREFIX = "gradeTrackData";

const GRADE_POINTS: Record<Grade, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
  F: 0,
};

const GRADES: Grade[] = ["A", "B", "C", "D", "E", "F"];

const inputClass =
  "w-full rounded-lg border border-[#E5E2D9] bg-[#FFFDF8] px-4 py-3 text-sm text-[#26352C] outline-none transition placeholder:text-[#8A9289] focus:border-[#244C3A] focus:ring-2 focus:ring-[#244C3A]/10";

const buttonClass =
  "rounded-lg bg-[#244C3A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#183729] disabled:cursor-not-allowed disabled:opacity-40";

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createSemester(name: string): Semester {
  return { id: makeId(), name, courses: [] };
}

function createSession(name: string): Session {
  return {
    id: makeId(),
    name,
    semesters: [
      createSemester("First Semester"),
      createSemester("Second Semester"),
    ],
  };
}

function createInitialData(): SavedData {
  const session = createSession("2026/2027");

  return {
    studentName: "",
    sessions: [session],
    selectedSessionId: session.id,
    selectedSemesterId: session.semesters[0].id,
  };
}


function calculateTotals(courses: Course[]) {
  const validCourses = courses.filter(
    (course) =>
      Number.isFinite(Number(course.credits)) &&
      Number(course.credits) > 0 &&
      Object.prototype.hasOwnProperty.call(GRADE_POINTS, course.grade),
  );

  const credits = validCourses.reduce(
    (total, course) => total + Number(course.credits),
    0,
  );

  const points = validCourses.reduce(
    (total, course) =>
      total + Number(course.credits) * GRADE_POINTS[course.grade],
    0,
  );

  return {
    credits,
    points,
    gpa: credits > 0 ? points / credits : 0,
  };
}


function formatGpa(value: number) {
  return value.toFixed(2);
}

function GradeBadge({ grade }: { grade: Grade }) {
  const styles: Record<Grade, string> = {
    A: "bg-[#DCE6DA] text-[#244C3A]",
    B: "bg-[#E3E9DE] text-[#365A43]",
    C: "bg-[#F1E8D3] text-[#79643B]",
    D: "bg-[#F0E0D4] text-[#80543A]",
    E: "bg-[#EEDFE0] text-[#813F48]",
    F: "bg-[#E8D8D8] text-[#762E38]",
  };

  return (
    <span
      className={`inline-flex min-w-9 justify-center rounded-lg px-3 py-1.5 text-xs font-black ${styles[grade]}`}
    >
      {grade}
    </span>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[#E5E2D9] bg-[#FFFDF8] p-5">
      <p className="text-sm text-[#6F786F]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#244C3A]">
        {value}
      </p>
      <p className="mt-2 text-xs text-[#6F786F]">{description}</p>
    </div>
  );
}

export default function Home() {
  const [studentName, setStudentName] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedSemesterId, setSelectedSemesterId] = useState("");
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageKey, setStorageKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);


  const [sessionName, setSessionName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [credits, setCredits] = useState("3");
  const [grade, setGrade] = useState<Grade>("A");
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [targetCgpa, setTargetCgpa] = useState("4.50");
  const [futureCredits, setFutureCredits] = useState("30");
  const [analyticsScope, setAnalyticsScope] = useState<"all" | "semester">(
    "all",
  );



useEffect(() => {
  const loadDashboard = async () => {
    try {
      // STEP A: Check whether a user is logged in
      const userResponse = await fetch("/api/auth/me");

      if (userResponse.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!userResponse.ok) {
        throw new Error("Could not verify your account.");
      }

      const userResult = await userResponse.json();
      const user = userResult.data;

      // STEP B: Create a separate localStorage key for this user
      const accountStorageKey = `${STORAGE_KEY_PREFIX}_${user.id}`;

      // STEP C: Save the logged-in user's information in React state

      setStudentName(user.fullname);

      // STEP D: Load this user's saved dashboard information
      const savedData = localStorage.getItem(accountStorageKey);
let savedSessions: Session[] = [];
let savedSessionId = "";
let savedSemesterId = "";

if (savedData) {
  const parsedData: SavedData = JSON.parse(savedData);

  savedSessions = parsedData.sessions || [];
  savedSessionId = parsedData.selectedSessionId || "";
  savedSemesterId = parsedData.selectedSemesterId || "";
} else {
  const initialData = createInitialData();

  savedSessions = initialData.sessions;
  savedSessionId = initialData.selectedSessionId;
  savedSemesterId = initialData.selectedSemesterId;
}

      // STEP E: Get this user's courses from MongoDB
      const coursesResponse = await fetch("/api/courses");

      if (coursesResponse.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!coursesResponse.ok) {
        throw new Error("Could not load your courses.");
      }

      
const coursesResult = await coursesResponse.json();

const dbCourses = (coursesResult.data || []).map(
  (course: { _id?: string; id?: string; [key: string]: unknown }) => ({
    ...course,
    id: String(course._id ?? course.id ?? ""),
  }),
);


      

      // STEP F: Put courses into their correct sessions and semesters
      const sessionsWithCourses = savedSessions.map((session) => ({
        ...session,
        semesters: session.semesters.map((semester) => ({
          ...semester,
          courses: dbCourses.filter(
            (course: Course) =>
              course.sessionId === session.id &&
              course.semesterId === semester.id,
          ),
        })),
      }));

      // STEP G: Update the dashboard
      setSessions(sessionsWithCourses);

      if (savedSessionId) {
        setSelectedSessionId(savedSessionId);
      } else if (sessionsWithCourses.length > 0) {
        setSelectedSessionId(sessionsWithCourses[0].id);
      }

      const selectedSession =
        sessionsWithCourses.find((session) => session.id === savedSessionId) ||
        sessionsWithCourses[0];

      if (selectedSession) {
        const selectedSemester =
          selectedSession.semesters.find(
            (semester) => semester.id === savedSemesterId,
          ) || selectedSession.semesters[0];

        if (selectedSemester) {
          setSelectedSemesterId(selectedSemester.id);
        }
      }

      // STEP H: Allow the save effect to use this user's storage key
      setStorageKey(accountStorageKey);
    } catch (error) {
      console.error("Failed to load GradeTrack data:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while loading your dashboard.",
      );
    } finally {
      setIsLoaded(true);
    }
  };

  loadDashboard();
}, []);

  // Save every change after the initial load.
  // Save this student's information under their own account key.
  useEffect(() => {
    if (!isLoaded || !storageKey) return;

    const data: SavedData = {
      studentName,
      sessions,
      selectedSessionId,
      selectedSemesterId,
    };

    localStorage.setItem(storageKey, JSON.stringify(data));
  }, [
    studentName,
    sessions,
    selectedSessionId,
    selectedSemesterId,
    isLoaded,
    storageKey,
  ]);

  const selectedSession = sessions.find(
    (session) => session.id === selectedSessionId,
  );

  const selectedSemester = selectedSession?.semesters.find(
    (semester) => semester.id === selectedSemesterId,
  );

  const allCourses = useMemo(
    () =>
      sessions.flatMap((session) =>
        session.semesters.flatMap((semester) => semester.courses),
      ),
    [sessions],
  );

  const semesterCourses = selectedSemester?.courses ?? [];

  const currentCourses =
    analyticsScope === "all" ? allCourses : semesterCourses;

  const semesterTotals = calculateTotals(semesterCourses);
  const cumulativeTotals = calculateTotals(allCourses);

  const gradeDistribution = useMemo(
    () =>
      GRADES.map((item) => ({
        grade: item,
        count: currentCourses.filter((course) => course.grade === item).length,
      })),
    [currentCourses],
  );

  const highestGradeCount = Math.max(
    1,
    ...gradeDistribution.map((item) => item.count),
  );

  const gpaTrend = sessions.map((session) => {
    const courses = session.semesters.flatMap((semester) => semester.courses);

    return {
      name: session.name,
      gpa: calculateTotals(courses).gpa,
      credits: calculateTotals(courses).credits,
    };
  });

  const parsedTarget = Number(targetCgpa);
  const parsedFutureCredits = Number(futureCredits);

  const targetInputsValid =
    targetCgpa.trim() !== "" &&
    futureCredits.trim() !== "" &&
    Number.isFinite(parsedTarget) &&
    parsedTarget >= 0 &&
    parsedTarget <= 5 &&
    Number.isFinite(parsedFutureCredits) &&
    parsedFutureCredits > 0;

  const requiredFutureGpa =
    targetInputsValid && cumulativeTotals.credits + parsedFutureCredits > 0
      ? (parsedTarget * (cumulativeTotals.credits + parsedFutureCredits) -
          cumulativeTotals.points) /
        parsedFutureCredits
      : 0;

  const targetAlreadyReached =
    targetInputsValid && cumulativeTotals.gpa >= parsedTarget;

  const targetIsPossible =
    targetInputsValid && requiredFutureGpa >= 0 && requiredFutureGpa <= 5;

  function updateSelectedSemesterCourses(nextCourses: Course[]) {
    setSessions((previous) =>
      previous.map((session) => ({
        ...session,
        semesters: session.semesters.map((semester) =>
          session.id === selectedSessionId && semester.id === selectedSemesterId
            ? { ...semester, courses: nextCourses }
            : semester,
        ),
      })),
    );
  }

  function resetCourseForm() {
    setCourseName("");
    setCourseCode("");
    setCredits("3");
    setGrade("A");
    setEditingCourseId(null);
    setError("");
  }

  async function loadCoursesFromDB() {

  }

  async function handleCourseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!courseName.trim()) {
      setError("Please enter the course name.");
      return;
    }

    const parsedCredits = Number(credits);

    if (
      credits.trim() === "" ||
      !Number.isFinite(parsedCredits) ||
      parsedCredits < 0
    ) {
      setError("Credits must be zero or greater.");
      return;
    }

    if (!selectedSession || !selectedSemester) {
      setError("Select an academic session and semester.");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        name: courseName.trim(),
        code: courseCode.trim().toUpperCase(),
        credits: parsedCredits,
        grade,
        sessionId: selectedSession.id,
        semesterId: selectedSemester.id,
        sessionName: selectedSession.name,
        semesterName: selectedSemester.name,
      };

      const response = await fetch(
        editingCourseId ? `/api/courses/${editingCourseId}` : "/api/courses",
        {
          method: editingCourseId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || "Failed to save course");
      }

      const result = await response.json();

      // Support either a direct course response or { data: course }
      const saved = result.data ?? result;

      const course: Course = {
        id: String(saved._id ?? saved.id),
        name: saved.name,
        code: saved.code ?? "",
        credits: saved.credits,
        grade: saved.grade,
        sessionId: saved.sessionId,
        semesterId: saved.semesterId,
        sessionName: saved.sessionName,
        semesterName: saved.semesterName,
      };

      const nextCourses = editingCourseId
        ? semesterCourses.map((item) =>
            item.id === editingCourseId ? course : item,
          )
        : [...semesterCourses, course];

      updateSelectedSemesterCourses(nextCourses);
      resetCourseForm();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the course.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function editCourse(course: Course) {
    setEditingCourseId(course.id);
    setCourseName(course.name);
    setCourseCode(course.code);
    setCredits(String(course.credits));
    setGrade(course.grade);
    setError("");

    document
      .getElementById("course-form")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function deleteCourse(courseId: string) {
    if (!window.confirm("Delete this course?")) return;

    setError("");

    try {
      // Old browser-generated IDs are not MongoDB IDs.
      const isMongoId = /^[a-f\d]{24}$/i.test(courseId);

      if (isMongoId) {
        const response = await fetch(`/api/courses/${courseId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || "Failed to delete course.");
        }
      }

      // Remove the course from the displayed semester.
      updateSelectedSemesterCourses(
        semesterCourses.filter((course) => course.id !== courseId),
      );

      if (editingCourseId === courseId) {
        resetCourseForm();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete course.",
      );
    }
  }

  function addSession() {
    const name = sessionName.trim();

    if (!name) {
      setError("Enter an academic session name first.");
      return;
    }

    if (
      sessions.some(
        (session) => session.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      setError("That academic session already exists.");
      return;
    }

    const newSession = createSession(name);

    setSessions((previous) => [...previous, newSession]);
    setSelectedSessionId(newSession.id);
    setSelectedSemesterId(newSession.semesters[0].id);
    setSessionName("");
    setError("");
    resetCourseForm();
  }

  function deleteSession() {
    if (sessions.length <= 1) {
      setError("You must keep at least one academic session.");
      return;
    }

    if (
      !window.confirm(
        `Delete the entire session "${selectedSession?.name}" and its courses?`,
      )
    ) {
      return;
    }

    const remaining = sessions.filter(
      (session) => session.id !== selectedSessionId,
    );

    setSessions(remaining);
    setSelectedSessionId(remaining[0].id);
    setSelectedSemesterId(remaining[0].semesters[0].id);
    resetCourseForm();
    setError("");
  }

  function handleSessionChange(id: string) {
    const session = sessions.find((item) => item.id === id);

    if (!session) return;

    setSelectedSessionId(id);
    setSelectedSemesterId(session.semesters[0].id);
    resetCourseForm();
  }

  function handleSemesterChange(id: string) {
    setSelectedSemesterId(id);
    resetCourseForm();
  }

async function handleLogout() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Logout failed. Please try again.");
    }

    window.location.href = "/login";
  } catch (error) {
    console.error("Logout failed:", error);

    setError(
      error instanceof Error
        ? error.message
        : "Unable to log out. Please try again.",
    );
  }
}

  function exportToPDF() {
    const pdf = new jsPDF();

    pdf.setFillColor(36, 76, 58);
    pdf.rect(0, 0, 210, 43, "F");

    pdf.setTextColor(220, 230, 218);
    pdf.setFontSize(23);
    pdf.text("GradeTrack", 14, 19);

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text("ACADEMIC PERFORMANCE REPORT", 14, 29);

    pdf.setTextColor(30, 41, 59);
    pdf.setFontSize(11);
    pdf.text(`Student: ${studentName || "Not provided"}`, 14, 55);
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 63);

    pdf.setFontSize(12);
    pdf.text(
      `Cumulative GPA: ${formatGpa(cumulativeTotals.gpa)} / 5.00`,
      14,
      77,
    );
    pdf.text(`Total credits: ${cumulativeTotals.credits}`, 14, 85);
    pdf.text(`Courses completed: ${allCourses.length}`, 14, 93);

    const rows = sessions.flatMap((session) =>
      session.semesters.flatMap((semester) =>
        semester.courses.map((course) => [
          session.name,
          semester.name,
          course.code || course.name,
          course.credits,
          course.grade,
          (course.credits * GRADE_POINTS[course.grade]).toFixed(2),
        ]),
      ),
    );

    autoTable(pdf, {
      startY: 103,
      head: [["Session", "Semester", "Course", "Credits", "Grade", "Points"]],
      body: rows,
      theme: "grid",
      headStyles: {
        fillColor: [36, 76, 58],
        textColor: [255, 255, 255],
      },
      alternateRowStyles: { fillColor: [247, 245, 239] },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    pdf.save("GradeTrack-Academic-Report.pdf");
  }

  if (!isLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F5EF] text-[#26352C]">
        <p className="animate-pulse text-lg font-semibold">
          Loading GradeTrack...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F5EF] text-[#26352C]">
      {/* Navigation */}
      <nav className="border-b border-[#E5E2D9] bg-[#F7F5EF]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5">
          <a href="#" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#244C3A] text-lg font-black text-white">
              G
            </span>
            <span className="text-xl font-black tracking-tight">
              Grade<span className="text-[#244C3A]">Track</span>
            </span>
          </a>

          <span className="hidden text-xs font-medium text-[#6F786F] sm:block">
            YOUR ACADEMIC JOURNEY, SIMPLIFIED
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToPDF}
              className="rounded-xl border border-[#E5E2D9] px-4 py-2.5 text-sm font-semibold transition hover:border-[#183729] hover:text-[#244C3A]"
            >
              Export PDF
            </button>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-[#244C3A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#183729]"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-10 px-5 py-10">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-[#E5E2D9] bg-[#FFFDF8] p-7 sm:p-10">
          <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#244C3A]/5 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#789477]/40	bg-[#244C3A]/5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-[#244C3A]">
                <span className="h-2 w-2 rounded-full 	bg-[#244C3A]" />
                Academic dashboard
              </span>

              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                Make every semester
                <span className="block text-[#244C3A]">count.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-[#6F786F] sm:text-base">
                Track your courses, calculate your GPA and CGPA, and plan your
                next academic milestone in one place.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E2D9] bg-[#F7F5EF]/70 p-5">
              <label
                htmlFor="studentName"
                className="mb-2 block text-sm font-semibold text-[#6F786F]"
              >
                Student name
              </label>

              <input
                id="studentName"
                className={inputClass}
                value={studentName}
                readOnly
              />

              <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#FFFDF8] p-4">
                <span className="text-xl">✦</span>
                <div>
                  <p className="text-sm font-bold text-[#26352C]">
                    Keep moving forward
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#6F786F]">
                    Your academic records are connected to your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Academic session and semester controls */}
        <section>
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#244C3A]">
              Workspace
            </p>
            <h2 className="mt-2 text-2xl font-black">Academic records</h2>
          </div>

          <div className="grid gap-4 rounded-2xl border border-[#E5E2D9] bg-[#FFFDF8] p-5 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label
                htmlFor="sessionSelect"
                className="mb-2 block text-xs font-semibold text-[#6F786F]"
              >
                Academic session
              </label>
              <select
                id="sessionSelect"
                className={inputClass}
                value={selectedSessionId ?? ""}
                onChange={(event) => handleSessionChange(event.target.value)}
              >
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="semesterSelect"
                className="mb-2 block text-xs font-semibold text-[#6F786F]"
              >
                Semester
              </label>
              <select
                id="semesterSelect"
                className={inputClass}
                value={selectedSemesterId ?? ""}
                onChange={(event) => handleSemesterChange(event.target.value)}
              >
                {selectedSession?.semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="newSession"
                className="mb-2 block text-xs font-semibold text-[#6F786F]"
              >
                Add academic session
              </label>
              <input
                id="newSession"
                className={inputClass}
                placeholder="e.g. 2027/2028"
                value={sessionName ?? ""}
                onChange={(event) => setSessionName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSession();
                  }
                }}
              />
            </div>

            <div className="flex items-end gap-2">
              <button onClick={addSession} className={`${buttonClass} flex-1`}>
                + Add session
              </button>
              <button
                onClick={deleteSession}
                title="Delete selected session"
                className="rounded-xl border border-[#813F48]/30 px-4 py-3 text-sm font-bold text-[#813F48] transition hover:bg-[#813F48]/10"
              >
                Delete
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-[#813F48]/30 bg-[#813F48]/10 px-4 py-3 text-sm text-[#813F48]"
            >
              {error}
            </div>
          )}
        </section>

        {/* Summary metrics */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Cumulative CGPA"
            value={formatGpa(cumulativeTotals.gpa)}
            description="Across all recorded courses"
          />
          <MetricCard
            label="Semester GPA"
            value={formatGpa(semesterTotals.gpa)}
            description={selectedSemester?.name ?? "Selected semester"}
          />
          <MetricCard
            label="Total credit units"
            value={String(cumulativeTotals.credits)}
            description="Credits across all semesters"
          />
          <MetricCard
            label="Courses recorded"
            value={String(allCourses.length)}
            description="All academic sessions"
          />
        </section>

        {/* Performance analytics: separate from the course manager */}
        <section className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#244C3A]">
                Insights
              </p>
              <h2 className="mt-2 text-2xl font-black">
                Performance analytics
              </h2>
              <p className="mt-2 text-sm text-[#6F786F]">
                Understand your grades and plan your next target.
              </p>
            </div>

            <select
              aria-label="Analytics scope"
              className={`${inputClass} sm:max-w-56`}
              value={analyticsScope}
              onChange={(event) =>
                setAnalyticsScope(event.target.value as "all" | "semester")
              }
            >
              <option value="all">All academic sessions</option>
              <option value="semester">Selected semester</option>
            </select>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* GPA trends */}
            <div className="rounded-2xl border border-[#E5E2D9] bg-[#FFFDF8] p-6">
              <h3 className="text-lg font-bold">GPA trends</h3>
              <p className="mt-1 text-xs text-[#6F786F]">
                Weighted GPA for each academic session
              </p>

              {gpaTrend.some((item) => item.credits > 0) ? (
                <div className="mt-6 space-y-5">
                  {gpaTrend.map((item) => (
                    <div key={item.name}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="truncate text-sm text-[#6F786F]">
                          {item.name}
                        </span>
                        <span className="text-sm font-black text-[#244C3A]">
                          {item.credits > 0 ? formatGpa(item.gpa) : "—"}
                        </span>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-[#E5E2D9]">
                        <div
                          className="h-full rounded-full bg-[#244C3A] transition-all duration-500"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, (item.gpa / 5) * 100),
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-[#E5E2D9] p-8 text-center">
                  <p className="text-sm font-semibold text-[#6F786F]">
                    No GPA data yet
                  </p>
                  <p className="mt-2 text-xs text-[#6F786F]">
                    Add courses with credits and grades to see your progress.
                  </p>
                </div>
              )}

              <p className="mt-5 text-xs text-[#6F786F]">
                GPA is shown on a 5.00 scale.
              </p>
            </div>

            {/* Grade distribution */}
            <div className="rounded-2xl border border-[#E5E2D9] bg-[#FFFDF8] p-6">
              <h3 className="text-lg font-bold">Grade distribution</h3>
              <p className="mt-1 text-xs text-[#6F786F]">
                Number of courses for each grade
              </p>

              <div className="mt-6 space-y-4">
                {gradeDistribution.map((item) => (
                  <div
                    key={item.grade}
                    className="grid grid-cols-[34px_1fr_30px] items-center gap-3"
                  >
                    <GradeBadge grade={item.grade} />

                    <div className="h-2.5 overflow-hidden rounded-full bg-[#E5E2D9]">
                      <div
                        className="h-full rounded-full bg-[#244C3A] transition-all duration-500"
                        style={{
                          width: `${(item.count / highestGradeCount) * 100}%`,
                        }}
                      />
                    </div>

                    <span className="text-right text-sm font-semibold text-[#6F786F]">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-xs text-[#6F786F]">
                {currentCourses.length} course
                {currentCourses.length === 1 ? "" : "s"} included.
              </p>
            </div>

            {/* Target CGPA calculator */}
            <div className="rounded-2xl border border-[#E5E2D9] bg-[#FFFDF8] p-6 lg:col-span-2">
              <div className="grid gap-7 lg:grid-cols-[1fr_1fr] lg:items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#244C3A]">
                    Plan ahead
                  </p>
                  <h3 className="mt-2 text-xl font-black">
                    Target CGPA calculator
                  </h3>
                  <p className="mt-3 max-w-lg text-sm leading-6 text-[#6F786F]">
                    Find the average GPA you need in your future courses to
                    reach your desired cumulative CGPA.
                  </p>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="targetCgpa"
                        className="mb-2 block text-xs font-semibold text-[#6F786F]"
                      >
                        Target CGPA (0–5)
                      </label>

                      <input
                        id="targetCgpa"
                        type="number"
                        min="0"
                        max="5"
                        step="0.01"
                        required
                        className={inputClass}
                        value={targetCgpa}
                        onChange={(event) => setTargetCgpa(event.target.value)}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="futureCredits"
                        className="mb-2 block text-xs font-semibold text-[#6F786F]"
                      >
                        Future credit units
                      </label>
                      <input
                        id="futureCredits"
                        type="number"
                        min="1"
                        step="1"
                        className={inputClass}
                        value={futureCredits}
                        onChange={(event) =>
                          setFutureCredits(event.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E5E2D9] bg-[#F7F5EF] p-6">
                  {!targetInputsValid ? (
                    <p className="text-sm leading-6 text-[#6F786F]">
                      Enter a target between 0 and 5 and a positive number of
                      future credit units.
                    </p>
                  ) : targetAlreadyReached ? (
                    <>
                      <p className="text-sm font-semibold text-[#244C3A]">
                        Target already reached
                      </p>
                      <p className="mt-3 text-3xl font-black text-[#26352C]">
                        {formatGpa(cumulativeTotals.gpa)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6F786F]">
                        Your current CGPA is already at or above your target.
                        You do not need a minimum future GPA to reach it,
                        although future grades can still change your CGPA.
                      </p>
                    </>
                  ) : targetIsPossible ? (
                    <>
                      <p className="text-sm font-semibold text-[#6F786F]">
                        Required future GPA
                      </p>
                      <p className="mt-3 text-5xl font-black text-[#244C3A]">
                        {formatGpa(requiredFutureGpa)}
                        <span className="ml-2 text-lg text-[#6F786F]">
                          / 5.00
                        </span>
                      </p>
                      <p className="mt-3 text-sm leading-6 text-[#6F786F]">
                        You need an average GPA of{" "}
                        <strong className="text-[#26352C]">
                          {formatGpa(requiredFutureGpa)}
                        </strong>{" "}
                        across your next {parsedFutureCredits} credit units to
                        reach a CGPA of {formatGpa(parsedTarget)}.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#813F48]">
                        Target not achievable with these credits
                      </p>
                      <p className="mt-3 text-3xl font-black text-[#26352C]">
                        {requiredFutureGpa > 5 ? "Above 5.00" : "Not possible"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#6F786F]">
                        Even a perfect future GPA of 5.00 will not reach this
                        target using the number of future credits entered.
                        Increase the future credits or adjust your target.
                      </p>
                    </>
                  )}

                  <p className="mt-5 border-t border-[#E5E2D9] pt-4 text-xs leading-5 text-[#6F786F]">
                    Estimate based on your recorded grades and credits. Actual
                    results depend on your institution&apos;s grading rules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main workspace */}
        <section className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          {/* Course manager */}
          <div className="rounded-2xl border border-[#E5E2D9] bg-[#FFFDF8] p-5 sm:p-6">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#244C3A]">
                  Course manager
                </p>
                <h2 className="mt-2 text-xl font-black">
                  {editingCourseId ? "Edit course" : "Add a course"}
                </h2>
                <p className="mt-2 text-xs leading-5 text-[#6F786F]">
                  {selectedSession?.name} · {selectedSemester?.name}
                </p>
              </div>

              <span className="rounded-xl bg-[#244C3A]/5 px-3 py-2 text-xs font-bold text-[#244C3A]">
                {semesterCourses.length} courses
              </span>
            </div>

            <form
              id="course-form"
              onSubmit={handleCourseSubmit}
              className="space-y-4"
            >
              <div>
                <label
                  htmlFor="courseName"
                  className="mb-2 block text-xs font-semibold text-[#6F786F]"
                >
                  Course title *
                </label>
                <input
                  id="courseName"
                  className={inputClass}
                  placeholder="e.g. Introduction to Programming"
                  value={courseName ?? ""}
                  onChange={(event) => setCourseName(event.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="courseCode"
                    className="mb-2 block text-xs font-semibold text-[#6F786F]"
                  >
                    Course code
                  </label>
                  <input
                    id="courseCode"
                    className={inputClass}
                    placeholder="e.g. CSC101"
                    value={courseCode ?? ""}
                    onChange={(event) => setCourseCode(event.target.value)}
                  />
                </div>

                <div>
                  <label
                    htmlFor="credits"
                    className="mb-2 block text-xs font-semibold text-[#6F786F]"
                  >
                    Credit units *
                  </label>
                  <input
                    id="credits"
                    type="number"
                    min="0"
                    step="0.5"
                    className={inputClass}
                    value={credits ?? ""}
                    onChange={(event) => setCredits(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="grade"
                  className="mb-2 block text-xs font-semibold text-[#6F786F]"
                >
                  Grade *
                </label>
                <select
                  id="grade"
                  className={inputClass}
                  value={grade}
                  onChange={(event) => setGrade(event.target.value as Grade)}
                >
                  {GRADES.map((item) => (
                    <option key={item} value={item}>
                      Grade {item} — {GRADE_POINTS[item]} points
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p role="alert" className="text-sm text-[#813F48]">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="submit"
                  className={buttonClass}
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingCourseId
                      ? "Save changes"
                      : "+ Add course"}
                </button>

                {editingCourseId && (
                  <button
                    type="button"
                    onClick={resetCourseForm}
                    className="rounded-xl border border-[#E5E2D9] px-5 py-3 text-sm font-semibold text-[#6F786F] transition hover:bg-[#E5E2D9]"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Course list */}
            <div className="mt-8 border-t border-[#E5E2D9] pt-6">
              <h3 className="mb-4 text-sm font-bold">Recorded courses</h3>

              {semesterCourses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#E5E2D9] p-8 text-center">
                  <div className="text-3xl">📚</div>
                  <p className="mt-3 text-sm font-semibold text-[#6F786F]">
                    No courses yet
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#6F786F]">
                    Add your first course above to start calculating your GPA.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {semesterCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex flex-col gap-4 rounded-xl border border-[#E5E2D9] bg-[#F7F5EF]/60 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <GradeBadge grade={course.grade} />

                        <div className="min-w-0">
                          <p className="wrap-break-word text-sm font-bold text-[#26352C]">
                            {course.name}
                          </p>
                          <p className="mt-1 text-xs text-[#6F786F]">
                            {course.code || "No course code"} · {course.credits}{" "}
                            credits ·{" "}
                            {(
                              course.credits * GRADE_POINTS[course.grade]
                            ).toFixed(2)}{" "}
                            weighted points
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => editCourse(course)}
                          className="rounded-lg border border-[#E5E2D9] px-3 py-2 text-xs font-semibold text-[#6F786F] transition hover:border-[#789477] hover:text-[#244C3A]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCourse(course.id)}
                          className="rounded-lg border border-[#813F48]/30 px-3 py-2 text-xs font-semibold text-[#813F48] transition hover:bg-[#813F48]/10"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Academic summary */}
          <div
            id="academic-summary"
            className="rounded-2xl border border-[#E5E2D9] bg-[#FFFDF8] p-5 sm:p-6"
          >
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#244C3A]">
                Your results
              </p>
              <h2 className="mt-2 text-xl font-black">Academic summary</h2>
              <p className="mt-2 text-sm text-[#6F786F]">
                A quick overview of your academic performance.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E2D9] bg-[#FFFDF8] p-6 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#6F786F]">
                Cumulative CGPA
              </p>
              <div className="mt-4 flex items-baseline justify-center gap-2">
                <span className="text-6xl font-black tracking-tighter text-[#244C3A]">
                  {formatGpa(cumulativeTotals.gpa)}
                </span>
                <span className="text-lg font-semibold text-[#6F786F]">
                  / 5.00
                </span>
              </div>

              <div className="mx-auto mt-5 h-2 max-w-xs overflow-hidden rounded-full bg-[#E5E2D9]">
                <div
                  className="h-full rounded-full bg-[#244C3A] transition-all duration-500"
                  style={{
                    width: `${Math.max(
                      0,
                      Math.min(100, (cumulativeTotals.gpa / 5) * 100),
                    )}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-[#6F786F]">
                {studentName.trim()
                  ? `Academic record for ${studentName.trim()}`
                  : "Add your name to personalize your report."}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#E5E2D9] p-4">
                <p className="text-xs text-[#6F786F]">Semester GPA</p>
                <p className="mt-2 text-2xl font-black text-[#244C3A]">
                  {formatGpa(semesterTotals.gpa)}
                </p>
              </div>

              <div className="rounded-xl border border-[#E5E2D9] p-4">
                <p className="text-xs text-[#6F786F]">Semester credits</p>
                <p className="mt-2 text-2xl font-black text-[#244C3A]">
                  {semesterTotals.credits}
                </p>
              </div>

              <div className="rounded-xl border border-[#E5E2D9] p-4">
                <p className="text-xs text-[#6F786F]">Weighted points</p>
                <p className="mt-2 text-2xl font-black text-[#244C3A]">
                  {cumulativeTotals.points.toFixed(2)}
                </p>
              </div>

              <div className="rounded-xl border border-[#E5E2D9] p-4">
                <p className="text-xs text-[#6F786F]">Total courses</p>
                <p className="mt-2 text-2xl font-black text-[#244C3A]">
                  {allCourses.length}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button onClick={exportToPDF} className={`${buttonClass} w-full`}>
                Export academic report as PDF
              </button>
            </div>

            <p className="mt-5 text-xs leading-5 text-[#6F786F]">
              GradeTrack calculates CGPA using total weighted grade points
              divided by total credit units. It does not simply average rounded
              semester GPAs.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="flex flex-col gap-3 border-t border-[#E5E2D9] py-6 text-center text-xs text-[#6F786F] sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>
            © {new Date().getFullYear()} GradeTrack. Built for your academic
            journey.
          </p>
          <p>Forest green. Warm ivory. Built for progress.</p>
        </footer>
      </div>
    </main>
  );
}
