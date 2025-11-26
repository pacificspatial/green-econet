// ProtectedRoute.tsx
import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAppSelector } from "@/hooks/reduxHooks";

interface ProtectedRouteProps {
  children: React.ReactNode;
  // true for Result page, false for Project page
  requireProcessed: boolean; 
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireProcessed,
}) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects } = useAppSelector((state) => state.project);

  // Find the project from the URL parameter
  const project = projects.find((p) => p.id === projectId);

  // If project doesn't exist, redirect to home
  if (!project) {
    return <Navigate to="/" replace />;
  }

  // If route requires processed project but it's not processed, redirect to project page
  if (requireProcessed && !project.processed) {
    return <Navigate to={`/project/${projectId}`} replace />;
  }

  // If route requires unprocessed project but it's processed, redirect to result page
  if (!requireProcessed && project.processed) {
    return <Navigate to={`/project/${projectId}/result`} replace />;
  }

  // All checks passed, render the children
  return <>{children}</>;
};