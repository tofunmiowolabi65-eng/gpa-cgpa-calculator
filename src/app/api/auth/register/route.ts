import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { hashPassword } from "@/lib/password";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { fullname, email, password } = body;

    // Validate input
    if (
      typeof fullname !== "string" ||
      !fullname.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Provide a name, valid email and password of at least 8 characters.",
        },
        { status: 400 },
      );
    }

    await connectDB();

    const normalizedEmail = email.trim().toLowerCase();

    // Check if the email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: "An account with this email already exists.",
        },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await User.create({
      fullname: fullname.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Account created successfully.",
        data: {
          id: user._id,
          fullname: user.fullname,
          email: user.email,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create account.",
      },
      { status: 500 },
    );
  }
}
