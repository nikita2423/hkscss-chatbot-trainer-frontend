"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrainerProvider } from "@/components/trainer/trainer-context";
import { DocumentsTab } from "@/components/trainer/documents-tab";
import { ChatTab } from "@/components/trainer/chat-tab";
import { LoginScreen } from "@/components/auth/login-screen";
import { Button } from "@/components/ui/button";
import { Suspense, useState } from "react";
import { LogOut, User } from "lucide-react";
// import { TrainerProvider } from "@/components/rag/trainer-context";

import TrainerPage from "./trainer/page";

export default function Page() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const handleLogin = () => {
    setIsAuthenticated(true);
    setUserEmail("admin@hkscss.com");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail("");
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <TrainerPage />
    // <TrainerProvider>
    //   <main className="mx-auto max-w-[1400px] px-4 py-6">
    //     <header className="mb-4 flex items-center justify-between">
    //       <div>
    //         <h1 className="text-balance text-2xl font-semibold">
    //           Chatbot Trainer
    //         </h1>
    //         <p className="text-muted-foreground">
    //           Upload documents by department, then test and review answers.
    //         </p>
    //       </div>

    //       <div className="flex items-center gap-4">
    //         <div className="flex items-center gap-2 text-sm">
    //           <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
    //             <User className="w-4 h-4 text-primary" />
    //           </div>
    //           <div className="text-right">
    //             <p className="font-medium">{userEmail}</p>
    //             <p className="text-xs text-muted-foreground">Administrator</p>
    //           </div>
    //         </div>
    //         <Button
    //           variant="outline"
    //           size="sm"
    //           onClick={handleLogout}
    //           className="flex items-center gap-2"
    //         >
    //           <LogOut className="w-4 h-4" />
    //           Logout
    //         </Button>
    //       </div>
    //     </header>

    //     <Tabs defaultValue="documents" className="w-full">
    //       <TabsList className="grid w-full grid-cols-2">
    //         <TabsTrigger value="documents">Documents</TabsTrigger>
    //         <TabsTrigger value="chat">Chat</TabsTrigger>
    //       </TabsList>

    //       <TabsContent value="documents" className="mt-4">
    //         <Suspense>
    //           <DocumentsTab />
    //         </Suspense>
    //       </TabsContent>

    //       <TabsContent value="chat" className="mt-4">
    //         <Suspense>
    //           <ChatTab />
    //         </Suspense>
    //       </TabsContent>
    //     </Tabs>
    //   </main>
    // </TrainerProvider>
  );
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
