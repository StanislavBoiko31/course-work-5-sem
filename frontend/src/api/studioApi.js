import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api/";

export const getPhotographers = () => axios.get("http://127.0.0.1:8000/api/photographers/");
export const getServices = () => axios.get(`${API_BASE_URL}services/`);
export const getPortfolio = () => axios.get(`${API_BASE_URL}portfolio/`);
export const getBookings = () => axios.get(`${API_BASE_URL}bookings/`);
