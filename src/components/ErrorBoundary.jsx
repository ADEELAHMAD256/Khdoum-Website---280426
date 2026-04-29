// src/components/ErrorBoundary.jsx
import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so fallback UI renders
    console.log("ErrorBoundary caught an error:", error);
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // You can log the error to an external service here
    console.error("ErrorBoundary caught an error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "2rem", color: "red", textAlign: "center" }}>
          <h2>Something went wrong</h2>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
