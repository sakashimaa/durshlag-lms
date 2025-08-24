import "server-only";
import { requireAdmin } from "./require-admin";
import { db } from "@/db";
import { course } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function getCourses() {
  await requireAdmin();

  const result = await db
    .select({
      id: course.id,
      title: course.title,
      smallDescription: course.smallDescription,
      duration: course.duration,
      level: course.level,
      status: course.status,
      price: course.price,
      fileKey: course.fileKey,
      slug: course.slug,
    })
    .from(course)
    .orderBy(desc(course.createdAt));

  return result;
}

export type CourseType = Awaited<ReturnType<typeof getCourses>>[0];
