import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/Flux_Dev_A_simplified_highcontrast_black_and_white_icon_of_a_c_3.jpg"; // ваш логотип

const Header = ({ user }) => {

  return (
    <nav
      className="d-flex align-items-center px-3 py-2"
      style={{
        borderBottom: "1px solid #eee",
        background: "#fff",
        minHeight: "60px",
      }}
    >
      {/* Логотип зліва */}
      <img
        src={logo}
        alt="Логотип"
        style={{ height: 40, width: 40, marginRight: 24 }}
      />

      {/* Меню по центру */}
      <div className="flex-grow-1 d-flex justify-content-center">
        {user?.role === "admin" ? (
          <>
            <Link className="mx-2" to="/admin/homepage-content">Адмін: Головна</Link>
            <Link className="mx-2" to="/admin/photographers">Адмін: Фотографи</Link>
            <Link className="mx-2" to="/admin/portfolio">Адмін: Портфоліо</Link>
            <Link className="mx-2" to="/admin/services">Адмін: Послуги</Link>
            <Link className="mx-2" to="/admin/additional-services">Адмін: Додаткові послуги</Link>
            <Link className="mx-2" to="/admin/bookings">Адмін: Фотосесії</Link>
          </>
        ) : user?.role === "photographer" ? (
          <>
            <Link className="mx-2" to="/photographer/profile">Кабінет майстра</Link>
          </>
        ) : (
          <>
            <Link className="mx-2" to="/">Загальне портфоліо</Link>
            <Link className="mx-2" to="/photographers">Майстри</Link>
            <Link className="mx-2" to="/services">Перелік послуг</Link>
            <Link className="mx-2" to="/booking">Замовити фотосесію</Link>
          </>
        )}
      </div>

      {/* Права частина: профіль */}
      <div className="d-flex align-items-center">
        {/* Профіль праворуч */}
        <Link to="/profile" className="ms-3" style={{ display: "flex", alignItems: "center" }}>
          {/* SVG-іконка користувача */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            fill="currentColor"
            viewBox="0 0 16 16"
            title="Профіль"
          >
            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
          </svg>
        </Link>
      </div>
    </nav>
  );
};

export default Header;