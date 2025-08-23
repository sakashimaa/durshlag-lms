"use client";

import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import * as Sentry from "@sentry/nextjs";

export function useSignOut() {
  const router = useRouter();

  const handleSignout = async function signOut() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          toast.success("Signed out successfully");
        },
        onError: (error) => {
          toast.error("Failed to sign out");
          Sentry.captureException(error);
        },
      },
    });
  };

  return handleSignout;
}
