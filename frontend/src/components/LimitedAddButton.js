import React from "react";

/**
 * Reusable button that prevents adding more items than the allowed limit.
 * - It disables itself when the count exceeds a maximum limit.
 * - Useful for limiting uploads, audio recording, images, etc.
 */
const LimitedAddButton = ({
  currentCount,
  maxCount,
  onClick,
  label,
  btnStyle = {},
}) => {
  // Disable button if current count reached the maximum limit
  const isDisabled = currentCount >= maxCount;

  return (
    <button
      style={{
        background: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "4px",
        padding: "10px 20px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.5 : 1,
        ...btnStyle,
      }}
      onClick={onClick}
      disabled={isDisabled}
      // Tooltip message in English
      title={
        isDisabled
          ? `You can only add up to ${maxCount} items. Please remove one first.`
          : ""
      }
    >
      {label}
    </button>
  );
};

export default LimitedAddButton;
