import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoadPayment({ 
  variant = "default", // "default", "compact", "outline"
  size = "lg", // "sm", "md", "lg"
}) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isTapped, setIsTapped] = useState(false);

  // Button variants
  const variants = {
    default: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white",
    compact: "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white",
    outline: "bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50"
  };

  // Size variants
  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const handleClick = () => {
    navigate("/payment");
  };

  const handleMouseDown = () => {
    setIsTapped(true);
  };

  const handleMouseUp = () => {
    setIsTapped(false);
  };

  const buttonStyle = {
    transform: isHovered ? 'scale(1.05)' : (isTapped ? 'scale(0.95)' : 'scale(1)'),
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg
        flex items-center justify-center gap-2
      `}
      style={buttonStyle}
    >
      <span>💎</span>
      <span>Upgrade to Premium</span>
    </button>
  );
}