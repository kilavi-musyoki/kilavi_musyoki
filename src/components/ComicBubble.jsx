import React from "react";

const ComicBubble = ({
  text = "👋",
  children,
  className = "",
  style = {},
}) => {
  // ── Shared styles ──────────────────────────────────────────────────
  const bubbleBody = {
    position: "relative",
    width: "min(150px, 72vw)",
    minHeight: 90,
    backgroundColor: "#ffffff",
    border: "4px solid #000000",
    borderRadius: "50%",
    transform: "rotate(-2deg)",
    boxShadow:
      "0 0 0 2px #4BD8A0, 0 0 12px rgba(75,216,160,0.45), 6px 6px 0px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "14px 20px",
    userSelect: "none",
  };

  const textStyle = {
    textAlign: "center",
    fontFamily: "'Bangers', 'Comic Sans MS', cursive",
    fontWeight: 900,
    fontSize: "clamp(0.85rem, 2.6vw, 1.05rem)",
    lineHeight: 1.25,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#000000",
  };

  const tailShared = {
    position: "absolute",
    borderRadius: "50%",
    backgroundColor: "#ffffff",
    borderStyle: "solid",
    borderColor: "#000000",
  };

  // Circles overlap: each one tucked under the previous
  const tail1 = {
    ...tailShared,
    left: 32,
    bottom: -12,
    width: 22,
    height: 22,
    borderWidth: 3.5,
    boxShadow: "0 0 0 1.5px #4BD8A0, 2px 2px 0px #000000",
    zIndex: 3,
  };

  const tail2 = {
    ...tailShared,
    left: 17,
    bottom: -20,
    width: 16,
    height: 16,
    borderWidth: 3,
    boxShadow: "0 0 0 1.5px #4BD8A0, 1px 1px 0px #000000",
    zIndex: 2,
  };

  const tail3 = {
    ...tailShared,
    left: 3,
    bottom: -26,
    width: 10,
    height: 10,
    borderWidth: 2.5,
    boxShadow: "0 0 0 1px #4BD8A0, 1px 1px 0px #000000",
    zIndex: 1,
  };

  return (
    <div
      className={className}
      style={{ position: "relative", display: "inline-block", ...style }}
    >
      {/* Speech Bubble Body */}
      <div style={bubbleBody}>
        <div style={textStyle}>{children || text}</div>

        {/* Tail Circle 1 (Largest) */}
        <div style={tail1} />
        {/* Tail Circle 2 (Medium) */}
        <div style={tail2} />
        {/* Tail Circle 3 (Smallest) */}
        <div style={tail3} />
      </div>
    </div>
  );
};

export default ComicBubble;
