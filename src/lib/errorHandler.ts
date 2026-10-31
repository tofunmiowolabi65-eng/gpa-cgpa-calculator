import { NextResponse } from "next/server";
import { ApiError } from "@/lib/ApiError";

export function errorHandler(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
        statusCode: error.statusCode,
      },
      { status: error.statusCode },
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: "Internal server error. Please try again later.",
      statusCode: 500,
    },
    { status: 500 },
  );
}
