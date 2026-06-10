import { useEffect, useState } from "react";
import AresLogin from "./AresLogin";
import "./AresPages.css";
import MonitorPage from "./pages/MonitorPage";
import ReportPage from "./pages/ReportPage";
import WorkerPage from "./pages/WorkerPage";
import { WebRTCSessionProvider } from "./WebRTCSession";

const pages = ["worker", "monitor", "report"];

function getRoute() {
  const route = window.location.hash.replace("#", "").split("?")[0];
  return route && (route === "login" || pages.includes(route)) ? route : "login";
}

export default function App() {
  const [route, setRoute] = useState(getRoute);

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (route === "worker" || route === "monitor" || route === "report") {
    return (
      <WebRTCSessionProvider active>
        {route === "worker" && <WorkerPage />}
        {route === "monitor" && <MonitorPage />}
        {route === "report" && <ReportPage />}
      </WebRTCSessionProvider>
    );
  }
  return <AresLogin />;
}
