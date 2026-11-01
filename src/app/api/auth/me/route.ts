import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { verifyAuthToken } from "@/lib/auth";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const userId = await verifyAuthToken(token);

  try {
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please log in.",
        },
        { status: 401 },
      );
    }

    // Keep the rest of your existing code here.

    await connectDB();

    const user = await User.findById(userId).select("_id fullname email");

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User account not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Current user error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve user information.",
      },
      { status: 500 },
    );
  }
}
