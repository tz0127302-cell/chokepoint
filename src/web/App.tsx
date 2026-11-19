import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.js";
import { DashboardPage } from "./pages/Dashboard.js";
import { MethodologyPage } from "./pages/Methodology.js";
import { NotFound } from "./pages/NotFound.js";

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
