import "server-only";
import { requireAdmin } from "./require-admin";
import { db } from "@/db";
import { eq } from "drizzle-orm";
import { lesson } from "@/db/schema";
import { notFound } from "next/navigation";

export async function adminGetLesson(id: string) {
  await requireAdmin();

  const result = await db.query.lesson.findFirst({
    where: eq(lesson.id, id),
    columns: {
      id: true,
      title: true,
      videoKey: true,
      thumbnailKey: true,
      description: true,
      position: true,
    },
  });

  if (!result) {
    return notFound();
  }

  return result;
}

export type AdminLessonType = Awaited<ReturnType<typeof adminGetLesson>>;
