import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./AppRoutes";

export default function Router() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
