"use client";

import { useTrainer } from "./trainer-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  MessageSquare,
  Users,
  Clock,
  TrendingUp,
  Activity,
} from "lucide-react";

export function DashboardTab() {
  const { departments, pdfs, messages, selectedDepartmentId } = useTrainer();

  // Calculate stats
  const totalDepartments = departments.length;
  const allDocuments = Object.values(pdfs).flat();
  const totalDocuments = allDocuments.length;
  const totalMessages = messages.length;

  // Documents by department
  const departmentStats = departments.map((dept) => ({
    ...dept,
    documentCount: pdfs[dept.id]?.length || 0,
  }));

  // Recent activity
  const recentDocuments = allDocuments.slice(0, 5);
  const recentMessages = messages.slice(-3).reverse();

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-6 p-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your chatbot training data and activity
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Departments
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDepartments}</div>
                <p className="text-xs text-muted-foreground">
                  Active departments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDocuments}</div>
                <p className="text-xs text-muted-foreground">
                  Training documents
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMessages}</div>
                <p className="text-xs text-muted-foreground">
                  Chat interactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Training Status
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-muted-foreground">Model readiness</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Department Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Department Overview
                </CardTitle>
                <CardDescription>
                  Document distribution across departments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {departmentStats.map((dept) => (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              selectedDepartmentId === dept.id
                                ? "bg-primary"
                                : "bg-muted-foreground/30"
                            }`}
                          />
                          <span className="text-sm font-medium">
                            {dept.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {dept.documentCount} docs
                          </Badge>
                          <div className="w-20">
                            <Progress
                              value={
                                (dept.documentCount /
                                  Math.max(totalDocuments, 1)) *
                                100
                              }
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {departmentStats.length === 0 && (
                      <div className="text-center text-muted-foreground text-sm py-8">
                        No departments configured yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest documents and conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-4">
                    {/* Recent Documents */}
                    {recentDocuments.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                          Recent Documents
                        </h4>
                        <div className="space-y-2">
                          {recentDocuments.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {doc.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  PDF Document
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Messages */}
                    {recentMessages.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2 text-muted-foreground">
                          Recent Conversations
                        </h4>
                        <div className="space-y-2">
                          {recentMessages.map((message, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-2 p-2 rounded-lg bg-muted/30"
                            >
                              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">
                                  {message.role === "user"
                                    ? "Question: "
                                    : "Answer: "}
                                  {message.content.substring(0, 50)}...
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {message.role === "user"
                                    ? "User"
                                    : "Assistant"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {recentDocuments.length === 0 &&
                      recentMessages.length === 0 && (
                        <div className="text-center text-muted-foreground text-sm py-8">
                          No recent activity
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Training Metrics
              </CardTitle>
              <CardDescription>
                Model performance and training progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Document Coverage</p>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    75% of documents processed
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Response Quality</p>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    85% accuracy rate
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Training Progress</p>
                  <Progress value={92} className="h-2" />
                  <p className="text-xs text-muted-foreground">92% complete</p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </ScrollArea>
    </div>
  );
}
