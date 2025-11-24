import React, { useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate, Link } from "react-router-dom";

const LoginPage = ({ onLogin }) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    try {
      // Використовуємо axiosInstance для логіну
      const res = await axiosInstance.post("/api/token/", form);
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      try {
        const profileRes = await axiosInstance.get("/api/auth/users/me/");
        const user = profileRes.data;
        localStorage.setItem("user", JSON.stringify(user));
        onLogin && onLogin();
        if (user.role === "photographer") {
          navigate("/photographer/profile");
        } else {
          navigate("/profile");
        }
      } catch (profileErr) {
        setError("Не вдалося отримати профіль користувача");
      }
    } catch (err) {
      setError("Помилка входу: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Вхід</h2>
      <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Пароль" value={form.password} onChange={handleChange} required />
      <button type="submit">Увійти</button>
      <div style={{ marginTop: 16 }}>
        <span>Ще не маєте акаунта? </span>
        <Link to="/register">Зареєструватися</Link>
      </div>
      {error && <div style={{color: "red"}}>{error}</div>}
    </form>
  );
};

export default LoginPage;
