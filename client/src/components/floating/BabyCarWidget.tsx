import { useEffect, useRef } from "react";

type PupilOffset = {
  x: number;
  y: number;
};

const DEFAULT_PUPIL_OFFSET: PupilOffset = { x: 0, y: 0 };
const PUPIL_LIMIT = 8;
const SVG_WIDTH = 300;
const SVG_HEIGHT = 200;
const LEFT_EYE_CENTER = { x: 100, y: 120 };
const RIGHT_EYE_CENTER = { x: 200, y: 120 };

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

  const angle = Math.atan2(deltaY, deltaX);
  const travel = Math.min(distance * 0.2, limit);

  return {
    x: Math.round(Math.cos(angle) * travel * 100) / 100,
    y: Math.round(Math.sin(angle) * travel * 100) / 100,
  };
}

export function BabyCarWidget() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const leftPupilRef = useRef<SVGGElement | null>(null);
  const rightPupilRef = useRef<SVGGElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return undefined;
    }

    const isTouchDevice = window.matchMedia?.("(pointer: coarse)").matches ?? false;
    const prefersReducedMotion =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    if (isTouchDevice || prefersReducedMotion) {
      return undefined;
    }

    const applyPupilOffset = (target: SVGGElement | null, offset: PupilOffset) => {
      target?.setAttribute("transform", `translate(${offset.x} ${offset.y})`);
    };

    const resetEyes = () => {
      applyPupilOffset(leftPupilRef.current, DEFAULT_PUPIL_OFFSET);
      applyPupilOffset(rightPupilRef.current, DEFAULT_PUPIL_OFFSET);
    };

    const updateEyes = (event: PointerEvent) => {
      const svgBox = svgRef.current?.getBoundingClientRect();

      if (!svgBox) {
        return;
      }

      const pointerX = ((event.clientX - svgBox.left) / svgBox.width) * SVG_WIDTH;
      const pointerY = ((event.clientY - svgBox.top) / svgBox.height) * SVG_HEIGHT;

      applyPupilOffset(
        leftPupilRef.current,
        calculatePupilOffset(pointerX, pointerY, LEFT_EYE_CENTER.x, LEFT_EYE_CENTER.y),
      );
      applyPupilOffset(
        rightPupilRef.current,
        calculatePupilOffset(pointerX, pointerY, RIGHT_EYE_CENTER.x, RIGHT_EYE_CENTER.y),
      );
    };

    window.addEventListener("pointermove", updateEyes, { passive: true });
    document.addEventListener("mouseleave", resetEyes);

    return () => {
      window.removeEventListener("pointermove", updateEyes);
      document.removeEventListener("mouseleave", resetEyes);
    };
  }, []);

  return (
    <div aria-label="Baby car mascot" className="baby-car">
      <svg
        aria-labelledby="baby-car-title"
        className="baby-car__svg"
        ref={svgRef}
        role="img"
        viewBox="0 0 300 200"
      >
        <title id="baby-car-title">Baby car mascot</title>
        <g className="baby-car__beacon">
          <rect fill="#005fa8" height="18" rx="6" width="86" x="107" y="20" />
          <circle cx="126" cy="19" fill="#f6c343" r="9" />
          <circle cx="150" cy="17" fill="#d71920" r="10" />
          <circle cx="174" cy="19" fill="#005fa8" r="9" />
          <text
            fill="#ffffff"
            fontFamily="Arial, sans-serif"
            fontSize="12"
            fontWeight="800"
            textAnchor="middle"
            x="150"
            y="34"
          >
            THÀNH CÔNG
          </text>
        </g>

        <g className="baby-car__body">
          <path
            d="M43 114c11-38 39-60 82-66h52c39 6 65 28 77 66l24 16v35H22v-34l21-17Z"
            fill="#d71920"
          />
          <path
            d="M80 62h94c25 4 45 22 57 51H57c5-27 12-43 23-51Z"
            fill="#fff7f7"
          />
          <path
            d="M92 70h70c18 3 32 15 41 34H74c4-17 10-28 18-34Z"
            fill="#edf4ff"
          />
          <path d="M36 134h46" stroke="#ffffff" strokeLinecap="round" strokeWidth="10" />
          <path d="M218 134h46" stroke="#ffffff" strokeLinecap="round" strokeWidth="10" />
          <path
            d="M109 139c10 10 22 15 41 15s31-5 41-15"
            fill="none"
            stroke="#101d35"
            strokeLinecap="round"
            strokeWidth="8"
          />
          <rect fill="#005fa8" height="22" rx="7" width="76" x="112" y="154" />
          <text
            fill="#ffffff"
            fontFamily="Arial, sans-serif"
            fontSize="14"
            fontWeight="800"
            textAnchor="middle"
            x="150"
            y="170"
          >
            TẬP LÁI
          </text>
          <circle cx="66" cy="164" fill="#101d35" r="22" />
          <circle cx="234" cy="164" fill="#101d35" r="22" />
          <circle cx="66" cy="164" fill="#ffffff" r="11" />
          <circle cx="234" cy="164" fill="#ffffff" r="11" />
        </g>

        <g className="baby-car__eyes">
          <circle className="baby-car__eye" cx="100" cy="120" fill="#ffffff" r="24" />
          <circle className="baby-car__eye" cx="200" cy="120" fill="#ffffff" r="24" />
          <g className="baby-car__pupil-group" ref={leftPupilRef} transform="translate(0 0)">
            <circle className="baby-car__pupil" cx="100" cy="120" fill="#101d35" r="9" />
            <circle className="baby-car__pupil-shine" cx="96" cy="116" fill="#ffffff" r="3" />
          </g>
          <g className="baby-car__pupil-group" ref={rightPupilRef} transform="translate(0 0)">
            <circle className="baby-car__pupil" cx="200" cy="120" fill="#101d35" r="9" />
            <circle className="baby-car__pupil-shine" cx="196" cy="116" fill="#ffffff" r="3" />
          </g>
        </g>
      </svg>
    </div>
  );
}
