import z from "zod";

export const courseLevels = ["beginner", "intermediate", "advanced"] as const;

export const courseStatus = ["draft", "published", "archived"] as const;

export const courseCategories = [
  "Development",
  "Business",
  "Finance",
  "IT & Software",
  "Office Productivity",
  "Personal Development",
  "Design",
  "Marketing",
  "Health & Fitness",
  "Music",
  "Teaching & Academics",
] as const;

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(255, { message: "Title must be less than 255 characters" }),
  description: z.string().or(z.object()),

  fileKey: z.string().min(1, { message: "File is required" }),
  price: z.coerce.number().min(1, { message: "Price must be greater than 0" }),

  duration: z.coerce
    .number()
    .min(1, { message: "Duration must be greater than 0" })
    .max(500, { message: "Duration must be less than 500" }),

  level: z.enum(courseLevels, { message: "Level is required" }),
  category: z.enum(courseCategories, { message: "Category is required" }),
  smallDescription: z
    .string()
    .min(3, { message: "Small description must be at least 3 characters" })
    .max(255, {
      message: "Small description must be less than 255 characters",
    }),
  slug: z
    .string()
    .min(3, { message: "Slug must be at least 3 characters" })
    .max(255, { message: "Slug must be less than 255 characters" }),

  status: z.enum(courseStatus, { message: "Status is required" }),
});

export const chapterSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  courseId: z.uuid({ message: "Invalid course ID" }),
});

export const lessonSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  courseId: z.uuid({ message: "Invalid course ID" }),
  chapterId: z.uuid({ message: "Invalid chapter ID" }),

  description: z.string().min(3, { message: "Description must be at least 3 characters" }).optional(),
  thumbnailKey: z.string().optional(),
  videoKey: z.string().optional(),
})

export type CourseSchema = z.infer<typeof courseSchema>;
export type ChapterSchema = z.infer<typeof chapterSchema>;
export type LessonSchema = z.infer<typeof lessonSchema>;
