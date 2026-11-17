"use client";

import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  const signOut = async () => {
    await createBrowserClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <button type="button" onClick={signOut}>
      Sair
    </button>
  );
}
