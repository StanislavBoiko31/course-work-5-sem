import React, { useEffect, useState } from "react";
import { getPhotographers } from "../api/studioApi";
import { Link } from "react-router-dom";
import ZoomableImage from "../components/ZoomableImage";

const getImageUrl = (url) => url?.startsWith('/media/') ? `http://localhost:8000${url}` : url;

const PhotographersPage = () => {
  const [photographers, setPhotographers] = useState([]);

  useEffect(() => {
    getPhotographers()
      .then(res => setPhotographers(res.data?.results || res.data || [])) // з урахуванням пагінації
      .catch(err => {
        console.error(err);
        setPhotographers([]);
      });
  }, []);

  return (
    <div className="container mt-4">
      <h2>Майстри</h2>
      <div className="row">
        {photographers.filter(ph => ph.user?.is_active).map(ph => (
          <div className="col-md-4 mb-4" key={ph.id}>
            <div className="card h-100">
              {/* Якщо у майстра є фото — додайте тут <img src={ph.photo} ... /> */}
              {ph.photo && (
                <ZoomableImage
                  src={getImageUrl(ph.photo)}
                  alt={ph.user ? ph.user : "Профіль фотографа"}
                  className="card-img-top"
                  style={{ objectFit: "cover", height: 200 }}
                />
              )}
              <div className="card-body">
                <h5 className="card-title">
                  {ph.user
                    ? `${ph.user.last_name || ""} ${ph.user.first_name || ""}`.trim() || ph.user.username
                    : `Майстри ${ph.id}`}
                </h5>
                <Link to={`/photographers/${ph.id}/portfolio`} className="btn btn-outline-primary">
                  Портфоліо
                </Link>
              </div>
            </div>
          </div>
        ))}
        {photographers.length === 0 && <div>Дані не знайдено</div>}
      </div>
    </div>
  );
};

export default PhotographersPage;