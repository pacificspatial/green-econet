// ProtectedRoute.tsx
import React, { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "@/hooks/reduxHooks";
import { setSelectedProject } from "@/redux/slices/projectSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProcessed: boolean; // true = result page, false = project page
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireProcessed,
}) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects } = useAppSelector((state) => state.project);
  const dispatch = useAppDispatch();

  // Find project based on URL
  const project = projects.find((p) => p.id === projectId);

  // If project not found → redirect
  if (!project) return <Navigate to="/" replace />;

  // Set selectedProject in Redux when route loads or projectId changes
  useEffect(() => {
    if (project) {
      dispatch(setSelectedProject(project));
    }
  }, [projectId, project, dispatch]);

  // require processed but not processed → redirect to project page
  if (requireProcessed && !project.processed) {
    return <Navigate to={`/project/${projectId}`} replace />;
  }

  // require NOT processed but project is processed → redirect to result page
  if (!requireProcessed && project.processed) {
    return <Navigate to={`/project/${projectId}/result`} replace />;
  }

  return <>{children}</>;
};
