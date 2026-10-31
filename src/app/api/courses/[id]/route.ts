import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Course from "@/models/Course";
import { getAuthenticatedUserId } from "@/lib/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedFields = [
  "name",
  "code",
  "credits",
  "grade",
  "sessionId",
  "semesterId",
  "sessionName",
  "semesterName",
];

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { message: "No valid fields provided" },
        { status: 400 },
      );
    }

    if (
      "name" in updates &&
      (typeof updates.name !== "string" || !updates.name.trim())
    ) {
      return NextResponse.json(
        { message: "Invalid course name" },
        { status: 400 },
      );
    }

    if (
      "credits" in updates &&
      (typeof updates.credits !== "number" ||
        !Number.isFinite(updates.credits) ||
        updates.credits < 0.5)
    ) {
      return NextResponse.json(
        { message: "Invalid course credits" },
        { status: 400 },
      );
    }

    if (
      "grade" in updates &&
      !["A", "B", "C", "D", "E", "F"].includes(String(updates.grade))
    ) {
      return NextResponse.json(
        { message: "Invalid course grade" },
        { status: 400 },
      );
    }

    if ("name" in updates) {
      updates.name = (updates.name as string).trim();
    }

    if ("code" in updates && typeof updates.code === "string") {
      updates.code = updates.code.trim().toUpperCase();
    }

    await connectDB();

    const course = await Course.findOneAndUpdate({ _id: id, userId }, updates, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("PATCH course error:", error);

    return NextResponse.json(
      { message: "Failed to update course" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json(
        { message: "Invalid course ID" },
        { status: 400 },
      );
    }

    await connectDB();

    const course = await Course.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("DELETE course error:", error);

    return NextResponse.json(
      { message: "Failed to delete course" },
      { status: 500 },
    );
  }
}
