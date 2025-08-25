"use server";

import { requireAdmin } from "@/app/data/admin/require-admin";
import { db } from "@/db";
import { chapter, course, lesson, session } from "@/db/schema";
import { ApiResponse } from "@/lib/types";
import {
  chapterSchema,
  ChapterSchema,
  courseSchema,
  CourseSchema,
  lessonSchema,
  LessonSchema,
} from "@/lib/zod-schemas";
import { and, asc, desc, eq } from "drizzle-orm";
import * as Sentry from "@sentry/nextjs";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { request } from "@arcjet/next";
import { revalidatePath } from "next/cache";

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

export async function ReorderLessons(
  chapterId: string,
  lessons: {
    id: string;
    position: number;
  }[],
  courseId: string
): Promise<ApiResponse> {
  await requireAdmin();

  try {
    if (!lessons || lessons.length === 0) {
      return {
        status: "error",
        message: "No lessons provided for reordering.",
      };
    }

    await Promise.all(
      lessons.map((less) =>
        db
          .update(lesson)
          .set({ position: less.position })
          .where(and(eq(lesson.id, less.id), eq(lesson.chapterId, chapterId)))
      )
    );

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lessons reordered successfully",
    };
  } catch (err) {
    Sentry.captureException(err);
    return {
      status: "error",
      message: "Failed to reorder lessons.",
    };
  }
}

export async function ReorderChapters(
  courseId: string,
  chapters: { id: string; position: number }[]
): Promise<ApiResponse> {
  await requireAdmin();

  try {
    if (!chapters || chapters.length === 0) {
      return {
        status: "error",
        message: "No chapters provided for reordering",
      };
    }

    await Promise.all(
      chapters.map((chap) =>
        db
          .update(chapter)
          .set({ position: chap.position })
          .where(and(eq(chapter.id, chap.id), eq(chapter.courseId, courseId)))
      )
    );

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapters reordered successfully",
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      status: "error",
      message: "Failed to reorder chapters",
    };
  }
}

export async function createChapter(
  values: ChapterSchema
): Promise<ApiResponse> {
  await requireAdmin();

  try {
    const result = chapterSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    const maxPos = await db.query.chapter.findFirst({
      where: eq(chapter.courseId, result.data.courseId),
      columns: {
        position: true,
      },
      orderBy: desc(chapter.position),
    });

    await db.insert(chapter).values({
      title: result.data.name,
      courseId: result.data.courseId,
      position: (maxPos?.position ?? 0) + 1,
    });

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Chapter created successfully",
    };
  } catch (err) {
    Sentry.captureException(err);
    return {
      status: "error",
      message: "Failed to create chapter",
    };
  }
}

export async function createLesson(values: LessonSchema): Promise<ApiResponse> {
  await requireAdmin();

  try {
    const result = lessonSchema.safeParse(values);

    if (!result.success) {
      return {
        status: "error",
        message: "Invalid data",
      };
    }

    const maxPos = await db.query.lesson.findFirst({
      where: eq(lesson.chapterId, result.data.chapterId),
      columns: {
        position: true,
      },
      orderBy: desc(chapter.position),
    });

    await db.insert(lesson).values({
      title: result.data.name,
      description: result.data.description,
      videoKey: result.data.videoKey,
      thumbnailKey: result.data.thumbnailKey,
      chapterId: result.data.chapterId,
      position: (maxPos?.position ?? 0) + 1,
    });

    revalidatePath(`/admin/courses/${result.data.courseId}/edit`);

    return {
      status: "success",
      message: "Lesson created successfully",
    };
  } catch (err) {
    Sentry.captureException(err);
    return {
      status: "error",
      message: "Failed to create Lesson",
    };
  }
}

export async function deleteLesson({
  chapterId,
  courseId,
  lessonId,
}: {
  chapterId: string;
  courseId: string;
  lessonId: string;
}): Promise<ApiResponse> {
  await requireAdmin();

  try {
    const chapterWithLessons = await db.query.chapter.findFirst({
      where: and(eq(chapter.id, chapterId), eq(chapter.courseId, courseId)),
      columns: {
        id: true,
        title: true,
        position: true,
      },
      with: {
        lessons: {
          orderBy: asc(lesson.position),
          columns: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!chapterWithLessons) {
      return {
        status: "error",
        message: "Chapter not found",
      };
    }

    const lessons = chapterWithLessons.lessons;

    const lessonToDelete = lessons.find((lesson) => lesson.id === lessonId);
    if (!lessonToDelete) {
      return {
        status: "error",
        message: "Lesson not found in the chapter",
      };
    }

    await db
      .delete(lesson)
      .where(and(eq(lesson.id, lessonId), eq(lesson.chapterId, chapterId)));

    const remainingLessons = await db.query.lesson.findMany({
      where: eq(lesson.chapterId, chapterId),
      columns: { id: true },
      orderBy: asc(lesson.position),
    });

    await Promise.all(
      remainingLessons.map((less, index) =>
        db
          .update(lesson)
          .set({ position: index + 1 })
          .where(eq(lesson.id, less.id))
      )
    );

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Lesson deleted successfully and positions are reordered",
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      status: "error",
      message: "Failed to delete lesson",
    };
  }
}

export async function deleteChapter({
  chapterId,
  courseId,
}: {
  chapterId: string;
  courseId: string;
}): Promise<ApiResponse> {
  await requireAdmin();

  try {
    const courseWithChapters = await db.query.course.findFirst({
      where: eq(course.id, courseId),
      with: {
        chapters: {
          orderBy: asc(chapter.position),
          columns: {
            id: true,
            position: true,
          },
        },
      },
    });

    if (!courseWithChapters) {
      return {
        status: "error",
        message: "Course not found",
      };
    }

    const chapters = courseWithChapters.chapters;

    const chapterToDelete = chapters.find((chap) => chap.id === chapterId);

    if (!chapterToDelete) {
      return {
        status: "error",
        message: "Chapter not found in the course",
      };
    }

    await db.delete(chapter).where(eq(chapter.id, chapterId));

    const remainingChapters = await db.query.chapter.findMany({
      where: eq(chapter.courseId, courseId),
      columns: { id: true },
      orderBy: asc(chapter.position),
    });

    await Promise.all(
      remainingChapters.map((chap, index) =>
        db
          .update(chapter)
          .set({ position: index + 1 })
          .where(eq(chapter.id, chap.id))
      )
    );

    revalidatePath(`/admin/courses/${courseId}/edit`);

    return {
      status: "success",
      message: "Chapter deleted successfully and positions are reordered",
    };
  } catch (error) {
    Sentry.captureException(error);
    return {
      status: "error",
      message: "Failed to delete chapter",
    };
  }
}
