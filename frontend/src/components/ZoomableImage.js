import React, { useState } from "react";

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.8)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  cursor: "zoom-out"
};

const imgStyle = {
  maxWidth: "90vw",
  maxHeight: "90vh",
  boxShadow: "0 0 24px #000",
  borderRadius: 8,
};

export default function ZoomableImage({ src, alt, style, className }) {
  const [zoomed, setZoomed] = useState(false);

  if (zoomed) {
    return (
      <div style={overlayStyle} onClick={() => setZoomed(false)}>
        <img src={src} alt={alt} style={imgStyle} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      style={{ cursor: "zoom-in", ...style }}
      className={className}
      onClick={() => setZoomed(true)}
    />
  );
} 