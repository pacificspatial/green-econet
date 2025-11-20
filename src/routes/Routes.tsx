// Routes.ts
import React from "react";
import MainLayout from "@/layout/MainLayout";
import ProjectsList from "@/pages/ProjectList";
import Project from "@/pages/Project";

interface Route {
  path: string;
  element: React.ReactNode;
}

const routes = (): Route[] => [
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
        <Project />
      </MainLayout>
    ),
  },
  {
    path: "/project",
    element: (
      <MainLayout>
        <div>Project Page</div>
      </MainLayout>
    ),
  }
];

export default routes;
