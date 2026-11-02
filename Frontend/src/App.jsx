import { useEffect } from "react";
import { Toaster } from "sonner";
import { useAuthStore } from "./store/authStore";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    try {
      window.localStorage.removeItem("craftmigo-auth");
    } catch (error) {
      console.warn("Unable to clear legacy persisted authentication data", error);
    }
    initialize();
    window.addEventListener("online", initialize);
    return () => window.removeEventListener("online", initialize);
  }, [initialize]);

  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}

export default App;
