// routes.ts
import React from "react";
import MainLayout from "@/layout/MainLayout";
import ProjectsList from "@/pages/ProjectList";
import Project from "@/pages/Project";
import { Result } from "@/pages/Result";
import { ProtectedRoute } from "@/routes/ProtectedRoute";

interface Route {
  path: string;
  element: React.ReactNode;
}

const routes: Route[] = [
  {
    path: "/",
    element: (
      <MainLayout>
        <ProjectsList />
      </MainLayout>
    ),
  },
  {
    path: "/project/:projectId",
    element: (
      <MainLayout>
        <ProtectedRoute requireProcessed={false}>
          <Project />
        </ProtectedRoute>
      </MainLayout>
    ),
  },
  {
    path: "/project/:projectId/result",
    element: (
      <MainLayout>
        <ProtectedRoute requireProcessed={true}>
          <Result />
        </ProtectedRoute>
      </MainLayout>
    ),
  },
];

export default routes;