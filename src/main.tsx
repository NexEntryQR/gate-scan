import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router";
import { queryClient } from "./lib/queryClient.ts";
import { GateSelectPage } from "./pages/GateSelectPage.tsx";
import { ScanPage } from "./pages/ScanPage.tsx";
import "./index.css";

const router = createBrowserRouter([
  { path: "/", element: <GateSelectPage /> },
  { path: "/scan", element: <ScanPage /> },
],
  {
    basename: "/scan",
  });

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
