import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import { errorHandler } from "@/lib/errorHandler";
import { getAuthenticatedUserId } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    await connectDB();

    const courses = await Course.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      message: "Courses loaded successfully",
      data: courses,
    });
  } catch (error: unknown) {
    return errorHandler(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const {
      name,
      code,
      credits,
      grade,
      sessionId,
      semesterId,
      sessionName,
      semesterName,
    } = body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof credits !== "number" ||
      !Number.isFinite(credits) ||
      credits < 0.5 ||
      !["A", "B", "C", "D", "E", "F"].includes(grade) ||
      typeof sessionId !== "string" ||
      !sessionId.trim() ||
      typeof semesterId !== "string" ||
      !semesterId.trim() ||
      typeof sessionName !== "string" ||
      !sessionName.trim() ||
      typeof semesterName !== "string" ||
      !semesterName.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid course details",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const course = await Course.create({
      userId,
      name: name.trim(),
      code: typeof code === "string" ? code.trim().toUpperCase() : "",
      credits,
      grade,
      sessionId,
      semesterId,
      sessionName,
      semesterName,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Course saved successfully",
        data: course,
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    return errorHandler(error);
  }
}
