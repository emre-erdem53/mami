import { Suspense } from "react";
import { LoginForm } from "./login-form";

function LoginFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#070709] px-4">
      <div className="h-10 w-10 animate-pulse rounded-xl bg-zinc-800" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
