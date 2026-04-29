import Router from "./routes"; // ✅ Don't rename this!
import ErrorBoundary from "./components/ErrorBoundary";

export default function App() {
  return (
    <ErrorBoundary>
      {/* <BrowserRouter> */}
      <Router />
      {/* </BrowserRouter> */}
    </ErrorBoundary>
  );
}
