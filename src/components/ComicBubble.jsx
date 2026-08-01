import React from "react";

const ComicBubble = ({
  text = "Hi! Welcome to my portfolio 👋",
  children,
  className = "",
  style = {},
}) => {
  return (
    <div className={`relative inline-block ${className}`} style={style}>
      {/* Speech Bubble */}
      <div
        className="
          relative
          w-[360px]
          max-w-[88vw]
          min-h-[160px]
          sm:h-[200px]
          bg-white
          border-[5px]
          border-black
          rounded-[50%]
          rotate-[-2deg]
          shadow-[8px_8px_0px_rgba(0,0,0,0.15)]
          flex
          items-center
          justify-center
          px-8
          py-6
          sm:px-10
          sm:py-8
          select-none
        "
      >
        <div
          className="
            text-center
            font-black
            text-xl
            sm:text-2xl
            leading-tight
            tracking-wide
            uppercase
            text-black
          "
          style={{
            fontFamily: "'Bangers', 'Comic Sans MS', 'Luckiest Guy', cursive",
          }}
        >
          {children || text}
        </div>

        {/* Tail */}
        <div
          className="
            absolute
            left-20
            bottom-[-18px]
            w-10
            h-10
            rounded-full
            bg-white
            border-[5px]
            border-black
          "
        ></div>

        <div
          className="
            absolute
            left-12
            bottom-[-45px]
            w-7
            h-7
            rounded-full
            bg-white
            border-[5px]
            border-black
          "
        ></div>

        <div
          className="
            absolute
            left-6
            bottom-[-66px]
            w-4
            h-4
            rounded-full
            bg-white
            border-[4px]
            border-black
          "
        ></div>
      </div>
    </div>
  );
};

export default ComicBubble;
