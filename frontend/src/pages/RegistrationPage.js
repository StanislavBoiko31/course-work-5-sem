import React, { useState } from "react";
import axiosInstance from "../axiosInstance";
import { useNavigate, Link } from "react-router-dom";

const RegistrationPage = () => {
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Скидаємо помилку перед новою спробою
    try {
      await axiosInstance.post("/api/register/", form);
      // Автоматичний вхід після реєстрації:
      const res = await axiosInstance.post("/api/token/", {
        email: form.email,
        password: form.password,
      });
      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);
      navigate("/profile");
    } catch (error) {
      setError("Помилка реєстрації: " + (error.response?.data?.email || error.message));
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Реєстрація</h2>
      <input name="first_name" placeholder="Ім'я" value={form.first_name} onChange={handleChange} required />
      <input name="last_name" placeholder="Фамілія" value={form.last_name} onChange={handleChange} required />
      <input name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
      <input name="password" type="password" placeholder="Пароль" value={form.password} onChange={handleChange} required />
      <button type="submit">Зареєструватись</button>
      <div style={{ marginTop: 16 }}>
        <span>Вже маєте акаунт? </span>
        <Link to="/login">Увійти</Link>
      </div>
      {error && <div style={{color: "red"}}>{error}</div>}
    </form>
  );
};

export default RegistrationPage;
