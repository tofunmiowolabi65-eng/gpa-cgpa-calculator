import { Schema, model, models } from "mongoose";

const courseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
    },
    credits: {
      type: Number,
      required: true,
      min: 0,
    },
    grade: {
      type: String,
      required: true,
      enum: ["A", "B", "C", "D", "E", "F"],
    },
    sessionId: {
      type: String,
      required: true,
    },
    semesterId: {
      type: String,
      required: true,
    },
    sessionName: {
      type: String,
      required: true,
    },
    semesterName: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Course = models.Course || model("Course", courseSchema);

export default Course;
