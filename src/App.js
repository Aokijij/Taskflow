import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import TaskCalendar from "./components/TaskCalendar";
import TaskStatistics from "./components/TaskStatistics";
import TaskStatusView from "./components/TaskStatusView";
import { useAuth } from "./contexts/AuthContext";
import Groups from "./pages/Groups";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import Categories from "./pages/Categories";
import Task from "./pages/Task";
import TaskDetails from "./pages/TaskDetails";
import Welcome from "./pages/Welcome";

function RouteLoading() {
  return <div className="text-center mt-5">Cargando sesi&oacute;n...</div>;
}

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <RouteLoading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/task" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <PublicRoute>
              <Welcome />
            </PublicRoute>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/task"
          element={
            <PrivateRoute>
              <Navbar />
              <Task />
            </PrivateRoute>
          }
        />
        <Route
          path="/task-status"
          element={
            <PrivateRoute>
              <Navbar />
              <TaskStatusView />
            </PrivateRoute>
          }
        />
        <Route
          path="/statistics"
          element={
            <PrivateRoute>
              <Navbar />
              <TaskStatistics />
            </PrivateRoute>
          }
        />
        <Route
          path="/categories"
          element={
            <PrivateRoute>
              <Navbar />
              <Categories />
            </PrivateRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <PrivateRoute>
              <Navbar />
              <TaskCalendar />
            </PrivateRoute>
          }
        />
        <Route
          path="/task/:taskId"
          element={
            <PrivateRoute>
              <Navbar />
              <TaskDetails />
            </PrivateRoute>
          }
        />
        <Route
          path="/groups"
          element={
            <PrivateRoute>
              <Navbar />
              <Groups />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Navbar />
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
