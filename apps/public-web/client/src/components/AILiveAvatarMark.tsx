type AILiveAvatarMarkProps = {
  className?: string;
  decorative?: boolean;
  title?: string;
};

export default function AILiveAvatarMark({
  className,
  decorative = false,
  title = "SIRINX AI Live Avatar",
}: AILiveAvatarMarkProps) {
  return (
    <svg
      viewBox="0 0 160 160"
      className={className}
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
      focusable="false"
    >
      <g className="sirinx-avatar-mark__tail">
        <path
          d="M112 105c20 3 30 18 21 30-8 11-31 7-27-7 2-7 11-7 15-2"
          fill="none"
          stroke="#38f4e4"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.48"
        />
      </g>
      <g className="sirinx-avatar-mark__halo">
        <circle
          cx="80"
          cy="82"
          r="62"
          fill="#07131f"
          stroke="#30f2df"
          strokeWidth="3"
          opacity="0.96"
        />
        <circle
          cx="80"
          cy="82"
          r="52"
          fill="#101c27"
          stroke="#d7b45a"
          strokeWidth="1.5"
          opacity="0.9"
        />
      </g>
      <g className="sirinx-avatar-mark__staff">
        <path
          d="M43 118 118 43"
          fill="none"
          stroke="#d7b45a"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.92"
        />
        <path
          d="M36 125 51 110M110 51l16-16"
          fill="none"
          stroke="#fff3bd"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.88"
        />
      </g>
      <g className="sirinx-avatar-mark__body">
        <path
          d="M48 76c-13-5-23 4-20 16 3 11 17 15 25 7M112 76c13-5 23 4 20 16-3 11-17 15-25 7"
          fill="#f7efe3"
          stroke="#d7b45a"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M46 78c0-26 16-43 34-43s34 17 34 43c0 28-15 48-34 48S46 106 46 78Z"
          fill="#f8f2e9"
          stroke="#d7b45a"
          strokeWidth="2"
        />
        <path
          d="M57 48c4-19 14-26 23-30 3 11-1 20-7 26 9-10 18-13 31-11-3 12-11 19-25 22"
          fill="#ffffff"
          stroke="#efe3c5"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M46 75c12-17 55-17 68 0-4 30-15 46-34 46S50 105 46 75Z"
          fill="#eedfcb"
          opacity="0.78"
        />
        <path
          d="M51 66c13-10 45-10 58 0M56 55c15-9 33-9 48 0"
          fill="none"
          stroke="#d7b45a"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="61" cy="82" r="11" fill="#17100c" />
        <circle cx="99" cy="82" r="11" fill="#17100c" />
        <circle cx="64" cy="78" r="3" fill="#fff8e8" />
        <circle cx="102" cy="78" r="3" fill="#fff8e8" />
        <path
          d="M70 101c4 3 16 3 20 0M75 94c2 2 8 2 10 0"
          fill="none"
          stroke="#7c5542"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M54 62c6-15 46-15 52 0"
          fill="none"
          stroke="#30f2df"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.76"
        />
        <path
          d="M69 45c7 7 15 7 22 0M68 42c-2-9 4-15 12-9 8-6 14 0 12 9"
          fill="none"
          stroke="#d7b45a"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M80 28v-9M57 38l-7-7M103 38l7-7"
          fill="none"
          stroke="#30f2df"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.78"
        />
        <path
          d="M55 130c11 10 39 10 50 0"
          fill="none"
          stroke="#d7b45a"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
      <g className="sirinx-avatar-mark__spark">
        <path
          d="M32 42c8-10 18-17 31-21M122 112c-7 8-17 14-29 18"
          fill="none"
          stroke="#38f4e4"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>
    </svg>
  );
}
