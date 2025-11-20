import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import routes from "@/routes/Routes";

import { I18n } from "aws-amplify/utils";
import { translations } from "@aws-amplify/ui-react";
import enTranslation from "@/i18n/locales/en/translation.json";
import jaTranslation from "@/i18n/locales/ja/translation.json";

import { useTranslation } from "react-i18next";
import { TFunction } from "i18next";

I18n.putVocabularies(translations);

function App() {
  const [currentLanguage, setCurrentLanguage] = useState("ja");
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    const langParam = new URLSearchParams(window.location.search).get("lang");
    if (langParam && ["en", "ja"].includes(langParam)) {
      setCurrentLanguage(langParam);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const translations = currentLanguage === "en" ? enTranslation.auth : jaTranslation.auth;
    I18n.putVocabularies({ [currentLanguage]: translations });
    I18n.setLanguage(currentLanguage);
  }, [currentLanguage]);

  return (
    <Router>
      <MyAppRoutes
        loading={loading}
        t={t}
      />
    </Router>
  );
}

interface MyAppRoutesProps {
  loading: boolean;
  t: TFunction<"translation", undefined>;
}

function MyAppRoutes({
  loading,
  t,
}: MyAppRoutesProps) {
  if (loading) {
    return <div>{t("app.loading")}...</div>;
  }
  return (
    <Routes>
      {routes().map((route, index) => (
        <Route key={index} path={route.path} element={route.element} />
      ))}
    </Routes>
  );
}

export default App;
