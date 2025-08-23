import "server-only";

import { db } from "@/db";
import { account, session, user, verification } from "@/db/schema";
import { env } from "@/lib/env";
import { resend } from "@/lib/resend";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP } from "better-auth/plugins";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      account,
      verification,
      session,
    },
  }),
  socialProviders: {
    github: {
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }) {
        await resend.emails.send({
          from: "DurshlagLMS <onboarding@resend.dev>",
          to: email,
          subject: "Durshlag LMS - Verify your email",
          html: `
          <p>Your verification code is <strong>${otp}</strong></p>
          <p>If you did not request this verification, please ignore this email.</p>
          `,
        });
      },
    }),
    admin(),
  ],
});
