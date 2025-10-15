"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, type AuthUser } from "@/lib/utils";
import TrainerPage from "@/components/trainer/page";

export default function TrainerRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = auth.isAuthenticated();
      const userData = auth.getUser();

      setIsAuthenticated(isAuth);
      setUser(userData);

      // Redirect to main page if not authenticated
      if (!isAuth) {
        router.push("/");
        return;
      }
    };

    checkAuth();
  }, [router]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, the useEffect will handle redirect
  // This is just a fallback
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, show the trainer interface
  return <TrainerPage />;
}
