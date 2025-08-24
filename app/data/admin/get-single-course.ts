import "server-only";
import { requireAdmin } from "./require-admin";
import { db } from "@/db";
import { course } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export async function getSingleCourse(id: string) {
  await requireAdmin();

  const data = await db.query.course.findFirst({
    where: eq(course.id, id),
    columns: {
      id: true,
      title: true,
      duration: true,
      level: true,
      status: true,
      price: true,
      fileKey: true,
      slug: true,
      smallDescription: true,
      description: true,
      category: true,
    },
    with: {
      chapters: {
        columns: {
          id: true,
          title: true,
          position: true,
        },
        with: {
          lessons: {
            columns: {
              id: true,
              title: true,
              description: true,
              thumbnailKey: true,
              videoKey: true,
              position: true,
            },
          },
        },
      },
    },
  });

  if (!data) {
    return notFound();
  }

  return data;
}

export type SingleCourse = Awaited<ReturnType<typeof getSingleCourse>>;
