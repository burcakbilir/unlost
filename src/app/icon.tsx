import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 8,
          background: "#22231f",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <span
            style={{
              fontSize: 22,
              fontStyle: "italic",
              color: "#f4f2ec",
              lineHeight: 1,
            }}
          >
            u
          </span>
          <span
            style={{
              width: 4,
              height: 4,
              borderRadius: "50%",
              background: "#9385e0",
              marginLeft: 2,
              marginBottom: 3,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
