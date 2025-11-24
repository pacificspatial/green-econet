import { createRoot } from "react-dom/client";
import "./index.css";
import App from "@/App";
import { ThemeContextProvider } from "./context/ThemeContextProvider";
import { BasemapProvider } from "./context/BasemapProvider";
import "./i18n/i18n";
import { Provider } from "react-redux";
import { persistor, store } from "./redux/store";
import { PersistGate } from "redux-persist/integration/react";

createRoot(document.getElementById("root")!).render(
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <BasemapProvider>
        <ThemeContextProvider>
          <App />
        </ThemeContextProvider>
      </BasemapProvider>
    </PersistGate>
  </Provider>
);
