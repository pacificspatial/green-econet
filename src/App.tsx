import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import routes from "@/routes/Routes";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useEffect, useState } from "react";
import { useAppDispatch } from "./hooks/reduxHooks";
import { setPassword } from "./redux/slices/authSlice";

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
  const dispatch = useAppDispatch();

  useEffect(() => {
    const saved = sessionStorage.getItem("auth_pwd");

    if (saved) {
      dispatch(setPassword(saved));
      setAuthorized(true);
      return;
    }

    askPassword();
  }, []);

  const askPassword = () => {
    const pwd = prompt("パスワードを入力してください");

    if (!pwd) return;

    sessionStorage.setItem("auth_pwd", pwd);
    dispatch(setPassword(pwd));
    setAuthorized(true);
  };

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
