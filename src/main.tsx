import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import "./index.css";
import { createAppRouter } from "./libs/router";
import { QueryProvider } from "./libs/queryClient";
import { loadConfig, getBasePath } from "./libs/appConfig";
import { ToastProvider } from "./libs/toastContext";
import { I18nextProvider } from "react-i18next";
import i18n from "./libs/i18n";

async function bootstrap() {
  await loadConfig();
  const router = createAppRouter(getBasePath());

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <QueryProvider>
        <ToastProvider>
          <I18nextProvider i18n={i18n}>
            <RouterProvider router={router} />
          </I18nextProvider>
        </ToastProvider>
      </QueryProvider>
    </StrictMode>,
  );
}

bootstrap();
