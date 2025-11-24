import axios from "axios";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000"
});

instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Обробка помилок 401 (Unauthorized)
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Спроба оновити токен
      const refreshToken = localStorage.getItem("refresh");
      if (refreshToken) {
        try {
          const response = await axios.post("http://127.0.0.1:8000/api/token/refresh/", {
            refresh: refreshToken
          });
          localStorage.setItem("access", response.data.access);
          
          // Повторюємо оригінальний запит з новим токеном
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return instance(originalRequest);
        } catch (refreshError) {
          // Якщо refresh токен не працює, видаляємо токени і перенаправляємо на логін
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          window.location.href = "/login";
        }
      } else {
        // Немає refresh токена, перенаправляємо на логін
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
