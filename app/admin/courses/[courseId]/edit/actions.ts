"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { db } from "@/db";
import { course, session } from "@/db/schema";
import { ApiResponse } from "@/lib/types";
import { courseSchema, CourseSchema } from "@/lib/zod-schemas";
import { and, eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";

const aj = arcjet
  .withRule(
    detectBot({
      mode: "LIVE",
      allow: [],
    })
  )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 10,
    })
  );

export async function EditCourse(
  data: CourseSchema,
  courseId: string
): Promise<ApiResponse> {
  const user = await requireAdmin();

  try {
    const req = await request();

    const decision = await aj.protect(req, {
      requested: 1,
      fingerprint: user?.user?.id as string,
    });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        return {
          status: "error",
          message: "Too many requests",
        };
      } else {
        return {
          status: "error",
          message: "You are a bot! If this is a mistake contact support.",
        };
      }
    }

    const result = courseSchema.safeParse(data);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    await db
      .update(course)
      .set({
        ...result.data,
      })
      .where(and(eq(course.id, courseId), eq(course.userId, user.user.id)));

    return {
      status: "success",
      message: "Course updated successfully",
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      status: "error",
      message: "An unexpected error occurred",
    };
  }
}
