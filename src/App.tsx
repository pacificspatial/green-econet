import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import routes from "@/routes/Routes";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useEffect, useState } from "react";

function App() {
  const { t } = useTranslation();
  return (
    <Router>
      <AuthWrapper>
        <MyAppRoutes loading={false} t={t} />
      </AuthWrapper>
    </Router>
  );
}

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    // Already logged in before?
    const saved = sessionStorage.getItem("auth_pass_ok");
    if (saved === "true") {
      setAuthorized(true);
      return;
    }

    // Ask password
    const pwd = prompt("Enter password:");
    if (pwd === "1234") {
      sessionStorage.setItem("auth_pass_ok", "true");
      setAuthorized(true);
    } else {
      alert("Wrong password. Reload to try again.");
    }
  }, []);

  if (!authorized) return null; 
  return <>{children}</>;
}

interface MyAppRoutesProps {
  loading: boolean;
  t: TFunction<"translation", undefined>;
}

function MyAppRoutes({ loading, t }: MyAppRoutesProps) {
  if (loading) {
    return <div>{t("app.loading")}...</div>;
  }

  return (
    <Routes>
      {routes.map((route, index) => (
        <Route key={index} path={route.path} element={route.element} />
      ))}
    </Routes>
  );
}

export default App;
