"use server";

import { db } from "@/db";
import { course } from "@/db/schema";
import { courseSchema, CourseSchema } from "@/lib/zod-schemas";
import { ApiResponse } from "@/lib/types";
import { requireAdmin } from "@/app/data/admin/require-admin";
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

export async function CreateCourse(data: CourseSchema): Promise<ApiResponse> {
  const session = await requireAdmin();

  try {
    const req = await request();

    const decision = await aj.protect(req, {
      requested: 1,
      fingerprint: session?.user?.id as string,
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

    const validation = courseSchema.safeParse(data);

    if (!validation.success) {
      return {
        status: "error",
        message: "Invalid Form Data",
      };
    }

    const created = await db
      .insert(course)
      .values({
        ...validation.data,
        userId: session?.user?.id as string,
      })
      .returning();

    return {
      status: "success",
      message: "Course created successfully",
      data: created,
    };
  } catch (error) {
    console.error(error);
    return {
      status: "error",
      message: "Failed to create course",
    };
  }
}
