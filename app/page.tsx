"use client";

import { LoginScreen } from "@/components/auth/login-screen";
import { Suspense, useState, useEffect } from "react";
import { auth, type AuthUser } from "@/lib/utils";
import TrainerPage from "../components/trainer/page";

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      const isAuth = auth.isAuthenticated();
      const userData = auth.getUser();

      setIsAuthenticated(isAuth);
      setUser(userData);
    };

    checkAuth();
  }, []);

  const handleLogin = () => {
    // Refresh auth state after successful login
    const isAuth = auth.isAuthenticated();
    const userData = auth.getUser();

    setIsAuthenticated(isAuth);
    setUser(userData);
  };

  const handleLogout = () => {
    auth.clearAuth();
    setIsAuthenticated(false);
    setUser(null);
  };

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <TrainerPage />;
}

// function Header() {
//   return (
//     <header className="border-b bg-card/50 supports-[backdrop-filter]:backdrop-blur">
//       <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
//         <div className="flex items-center gap-2">
//           <span
//             className={cn(
//               "inline-flex h-8 w-8 items-center justify-center rounded-full",
//               "bg-primary text-primary-foreground"
//             )}
//           >
//             R
//           </span>
//           <div className="leading-tight">
//             <h1 className="text-sm font-semibold">RAG Trainer</h1>
//             <p className="text-xs text-muted-foreground">
//               Upload PDFs • Ask • Review • Improve
//             </p>
//           </div>
//         </div>
//         <div className="flex items-center gap-2">
//           <Button variant="secondary" className="h-8">
//             Show Widgets
//           </Button>
//           <Button className="h-8">Publish</Button>
//           <Button asChild className="h-8">
//             <Link href="/trainer">Open Trainer</Link>
//           </Button>
//         </div>
//       </div>
//     </header>
//   );
// }

// function Footer() {
//   return (
//     <footer className="border-t">
//       <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 h-12 text-xs text-muted-foreground flex items-center justify-between">
//         <p>© 2025 RAG Trainer</p>
//         <p>Last updated: just now</p>
//       </div>
//     </footer>
//   );
// }
