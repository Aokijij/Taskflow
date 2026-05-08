import { render, screen } from "@testing-library/react";
jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { TaskProvider } from "./contexts/TaskContext";
import { ThemeProvider } from "./contexts/ThemeContext";

test("renders public welcome screen", async () => {
  render(
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          <App />
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );

  expect(await screen.findByText(/planifica, colabora y avanza/i)).toBeInTheDocument();
});
