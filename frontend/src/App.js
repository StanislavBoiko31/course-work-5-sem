import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import PortfolioPage from "./pages/PortfolioPage";
import PhotographersPage from "./pages/PhotographersPage";
import ServicesPage from "./pages/ServicesPage";
import BookingPage from "./pages/BookingPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import ServiceDetailPage from "./pages/ServiceDetailPage";
import PhotographerPortfolioPage from "./pages/PhotographerPortfolioPage";
import AdminPhotographersPage from "./pages/AdminPhotographersPage";
import AdminPortfolioPage from "./pages/AdminPortfolioPage";
import AdminServicesPage from "./pages/AdminServicesPage";
import AdminAdditionalServicesPage from "./pages/AdminAdditionalServicesPage";
import AdminBookingsPage from "./pages/AdminBookingsPage";
import AdminHomePageContentPage from "./pages/AdminHomePageContentPage";
import { createContext } from "react";
import axiosInstance from "./axiosInstance";
import PhotographerProfilePage from "./pages/PhotographerProfilePage";

export const UserContext = createContext(null);

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem("access"));
  const [user, setUser] = useState(null);

  // Оновлюємо стан при зміні токена
  useEffect(() => {
    setIsAuth(!!localStorage.getItem("access"));
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (localStorage.getItem("access")) {
        try {
          const res = await axiosInstance.get("/api/auth/users/myprofile/");
          setUser(res.data);
        } catch {}
      } else {
        setUser(null);
      }
    };
    fetchProfile();
  }, [isAuth]);

  // Функції для переходу після логіну/реєстрації/логауту
  const handleLogin = () => setIsAuth(true);
  const handleLogout = () => setIsAuth(false);
  const handleRegister = () => setIsAuth(false); // після реєстрації можна одразу логінити

  // Захищений роут
  const PrivateRoute = ({ children }) => {
    return isAuth ? children : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Header user={user} />
      <Routes>
        <Route path="/" element={<PortfolioPage isAuth={isAuth} />} />
        <Route path="/photographers" element={<PhotographersPage />} />
        <Route path="/photographers/:id/portfolio" element={<PhotographerPortfolioPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/:id" element={<ServiceDetailPage />} />
        <Route path="/booking" element={<BookingPage />} />

        {/* Вхід/реєстрація */}
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegistrationPage onRegister={handleRegister} />} />

        {/* Особистий кабінет — тільки для авторизованих */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage onLogout={handleLogout} />
            </PrivateRoute>
          }
        />

        {/* Кабінет майстра — тільки для фотографа */}
        <Route
          path="/photographer/profile"
          element={
            <PrivateRoute>
              {user?.role === "photographer" ? <PhotographerProfilePage /> : <Navigate to="/" />}
            </PrivateRoute>
          }
        />

        {/* Адмін-контент головної сторінки */}
        <Route path="/admin/homepage-content" element={<PrivateRoute><AdminHomePageContentPage /></PrivateRoute>} />
        {/* Адмін-фотографи */}
        <Route path="/admin/photographers" element={<AdminPhotographersPage />} />
        {/* Адмін-портфоліо */}
        <Route path="/admin/portfolio" element={<PrivateRoute><AdminPortfolioPage /></PrivateRoute>} />
        {/* Адмін-послуги */}
        <Route path="/admin/services" element={<PrivateRoute><AdminServicesPage /></PrivateRoute>} />
        {/* Адмін-додаткові послуги */}
        <Route path="/admin/additional-services" element={<PrivateRoute><AdminAdditionalServicesPage /></PrivateRoute>} />
        {/* Адмін-фотосесії */}
        <Route path="/admin/bookings" element={<PrivateRoute><AdminBookingsPage /></PrivateRoute>} />

        {/* Редірект на головну для невідомих сторінок */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;