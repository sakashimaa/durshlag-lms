import { env } from "@/lib/env";
import { S3 } from "@/lib/S3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import arcjet, { detectBot, fixedWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";

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
      max: 5,
    })
  );

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin();

  try {
    const decision = await aj.protect(request, {
      requested: 1,
      fingerprint: session?.user?.id as string,
    });

    if (decision.isDenied()) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const body = await request.json();
    const key = body?.key as string | undefined;
    console.log("KEY:", key);

    if (!key || typeof key !== "string" || key.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Key is required",
        },
        { status: 400 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: key,
    });

    await S3.send(command);

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete file",
      },
      { status: 500 }
    );
  }
}
