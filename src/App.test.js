import { render, screen } from "@testing-library/react";
jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
}));

import App from "./App";
import { AuthProvider } from "./contexts/AuthContext";
import { TaskProvider } from "./contexts/TaskContext";

test("renders login screen", async () => {
  render(
    <AuthProvider>
      <TaskProvider>
        <App />
      </TaskProvider>
    </AuthProvider>
  );

  expect(await screen.findByText(/bienvenido/i)).toBeInTheDocument();
});
