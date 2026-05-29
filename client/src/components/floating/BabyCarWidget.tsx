import { useEffect, useRef, useState } from "react";

type PupilOffset = {
  x: number;
  y: number;
};

const DEFAULT_PUPIL_OFFSET: PupilOffset = { x: 0, y: 0 };
const PUPIL_LIMIT = 7;

export function calculatePupilOffset(
  mouseX: number,
  mouseY: number,
  centerX: number,
  centerY: number,
  limit = PUPIL_LIMIT,
): PupilOffset {
  const deltaX = mouseX - centerX;
  const deltaY = mouseY - centerY;
  const distance = Math.hypot(deltaX, deltaY);

  if (distance === 0) {
    return DEFAULT_PUPIL_OFFSET;
  }

  const scale = Math.min(limit, distance) / distance;

  return {
    x: Math.round(deltaX * scale * 100) / 100,
    y: Math.round(deltaY * scale * 100) / 100,
  };
}

export function BabyCarWidget() {
  const carRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [pupilOffset, setPupilOffset] = useState(DEFAULT_PUPIL_OFFSET);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const isTouchDevice = window.matchMedia?.("(pointer: coarse)").matches ?? false;

    if (isTouchDevice) {
      return undefined;
    }

    const updateEyes = (event: MouseEvent) => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }

      frameRef.current = window.requestAnimationFrame(() => {
        const carBox = carRef.current?.getBoundingClientRect();

        if (!carBox) {
          return;
        }

        setPupilOffset(
          calculatePupilOffset(
            event.clientX,
            event.clientY,
            carBox.left + carBox.width / 2,
            carBox.top + carBox.height * 0.38,
          ),
        );
      });
    };

    const resetEyes = () => setPupilOffset(DEFAULT_PUPIL_OFFSET);

    window.addEventListener("mousemove", updateEyes);
    document.addEventListener("mouseleave", resetEyes);

    return () => {
      window.removeEventListener("mousemove", updateEyes);
      document.removeEventListener("mouseleave", resetEyes);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div aria-label="Baby car tập lái" className="baby-car" ref={carRef}>
      <svg
        aria-labelledby="baby-car-title"
        className="baby-car__svg"
        role="img"
        viewBox="0 0 190 128"
      >
        <title id="baby-car-title">Baby car tập lái</title>
        <g className="baby-car__body">
          <path
            d="M35 74c6-22 21-36 45-42h42c20 5 33 18 39 40l11 8v18H20V82l15-8Z"
            fill="#d71920"
          />
          <path
            d="M59 37h57c14 3 25 13 32 28H43c4-14 9-23 16-28Z"
            fill="#fff7f7"
          />
          <path
            d="M69 42h41c10 2 18 8 23 18H56c3-9 7-15 13-18Z"
            fill="#edf4ff"
          />
          <rect fill="#005fa8" height="18" rx="5" width="58" x="65" y="75" />
          <text
            fill="#ffffff"
            fontFamily="Arial, sans-serif"
            fontSize="12"
            fontWeight="800"
            textAnchor="middle"
            x="94"
            y="88"
          >
            TẬP LÁI
          </text>
          <circle cx="51" cy="98" fill="#101d35" r="14" />
          <circle cx="139" cy="98" fill="#101d35" r="14" />
          <circle cx="51" cy="98" fill="#ffffff" r="7" />
          <circle cx="139" cy="98" fill="#ffffff" r="7" />
          <path d="M28 82h28" stroke="#ffffff" strokeLinecap="round" strokeWidth="6" />
          <path d="M134 82h28" stroke="#ffffff" strokeLinecap="round" strokeWidth="6" />
        </g>
        <g className="baby-car__eyes">
          <circle className="baby-car__eye" cx="76" cy="60" fill="#ffffff" r="12" />
          <circle className="baby-car__eye" cx="114" cy="60" fill="#ffffff" r="12" />
          <circle
            className="baby-car__pupil"
            cx={76 + pupilOffset.x}
            cy={60 + pupilOffset.y}
            fill="#101d35"
            r="4.5"
          />
          <circle
            className="baby-car__pupil"
            cx={114 + pupilOffset.x}
            cy={60 + pupilOffset.y}
            fill="#101d35"
            r="4.5"
          />
        </g>
      </svg>
    </div>
  );
}
