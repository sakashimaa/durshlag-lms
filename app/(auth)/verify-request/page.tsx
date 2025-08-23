"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";

export default function VerifyRequestPage() {
  const router = useRouter();

  const [otp, setOtp] = useState("");
  const [emailPending, startTransition] = useTransition();
  const [resendCooldown, setResendCooldown] = useState(0);
  const params = useSearchParams();
  const email = params.get("email") as string;
  const isOtpCompleted = otp.length === 6;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timerId = setInterval(() => {
      setResendCooldown((secondsRemaining) => secondsRemaining - 1);
    }, 1000);
    return () => clearInterval(timerId);
  }, [resendCooldown]);

  function verifyOtp() {
    startTransition(async () => {
      await authClient.signIn.emailOtp({
        email,
        otp,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed in, you will be redirected soon");
            router.push("/");
          },
          onError: (err) => {
            toast.error("Something went wrong. Try again later.");
            Sentry.captureException(err);
          },
        },
      });
    });
  }

  async function resendOtp() {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    startTransition(async () => {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "sign-in",
        fetchOptions: {
          onSuccess: () => {
            toast.success("Email sent");
          },
          onError: (err) => {
            toast.error("Something went wrong. Try again later.");
            Sentry.captureException(err);
            setResendCooldown(0);
          },
        },
      });
    });
  }

  return (
    <Card className="w-full mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl mb-2">Please check your email</CardTitle>
        <CardDescription>
          We have sent a verification email code to your email address. Please
          open the email and paste the code below.
        </CardDescription>
        <p className="text-sm text-muted-foreground">
          Don&apos;t receive the code?{" "}
          <span
            className={`underline ${
              resendCooldown > 0
                ? "cursor-not-allowed opacity-60 pointer-events-none"
                : "cursor-pointer"
            }`}
            onClick={resendCooldown > 0 ? undefined : resendOtp}
            aria-disabled={resendCooldown > 0}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
          </span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-2">
          <InputOTP
            value={otp}
            onChange={(value) => setOtp(value)}
            maxLength={6}
            className="gap-2"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          <p className="text-sm text-muted-foreground mt-2">
            Enter the 6-digit code send to your email
          </p>
        </div>

        <Button
          onClick={verifyOtp}
          className="w-full mt-4"
          disabled={emailPending || !isOtpCompleted}
        >
          {emailPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" />
              <span>Loading...</span>
            </>
          ) : (
            "Verify account"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
