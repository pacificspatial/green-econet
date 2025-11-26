import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import routes from "@/routes/Routes";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

function App() {
  const { t } = useTranslation();
  return (
    <Router>
      <MyAppRoutes loading={false} t={t} />
    </Router>
  );
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