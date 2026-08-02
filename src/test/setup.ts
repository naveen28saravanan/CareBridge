import "@testing-library/jest-dom/vitest";

// Disable the backend API so authService uses its localStorage fallback path.
// This ensures unit tests are self-contained and never depend on a live server.
// The live server integration is covered by the Selenium E2E suite.
