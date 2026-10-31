import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    return NextResponse.json({
      success: true,
      message: "GradeTrack connected to MongoDB successfully!",
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed. Check the server terminal.",
      },
      { status: 500 },
    );
  }
}
