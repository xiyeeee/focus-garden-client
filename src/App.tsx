import { Routes, Route } from "react-router";
import { GardenLayout } from "@/layouts/GardenLayout";
import { FocusLayout } from "@/layouts/FocusLayout";
import { lazy, Suspense } from "react";
const TasksPage = lazy(() =>
  import("@/pages/TasksPage").then((module) => ({ default: module.TasksPage })),
);
import { FocusScaffoldPage } from "@/pages/scaffolds/FocusScaffoldPage";
import { RecordsScaffoldPage } from "@/pages/scaffolds/RecordsScaffoldPage";
import { CollectionScaffoldPage } from "@/pages/scaffolds/CollectionScaffoldPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { VerificationPage } from "@/pages/VerificationPage";
import { LoginPage } from "@/pages/LoginPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
const App = () => (
  <Routes>
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<VerificationPage mode="register" />} />
    <Route path="forgot-password" element={<VerificationPage mode="reset" />} />
    <Route element={<RequireAuth />}>
      <Route element={<GardenLayout />}>
        <Route
          index
          element={
            <Suspense
              fallback={
                <div className="fg-task-loading" role="status">
                  正在打开任务页面…
                </div>
              }
            >
              <TasksPage />
            </Suspense>
          }
        />
        <Route path="records" element={<RecordsScaffoldPage />} />
        <Route path="collection" element={<CollectionScaffoldPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<FocusLayout />}>
        <Route path="focus/:sessionId" element={<FocusScaffoldPage />} />
      </Route>
    </Route>
  </Routes>
);
export default App;
