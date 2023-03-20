import { useEffect } from "react";
import "./index.scss";

export interface BitsNameProps {
  qbitLengths: string[];
  alignment: string;
  gridHeight: number;
}

const BitsName = (props: BitsNameProps) => {
  const { qbitLengths, alignment, gridHeight } = props;
  const height = gridHeight.toString();
  const width = gridHeight < 40 ? gridHeight : 40;
  var fontSize = gridHeight / 2.5 <= 16 ? gridHeight / 2.5 : 16;
  return (
    <div
      className="bitsName"
      style={{ width: (width * 1.2).toString() + "px" }}
    >
      {qbitLengths.map((item) => {
        switch (item) {
          case "···":
            // case "...":
            return (
              <div className="qbitTitle" style={{ height: height + "px" }}>
                <span
                  className="title-q"
                  style={{
                    height: height + "px",
                    lineHeight: height + "px",
                    fontSize: fontSize.toString() + "px",
                    textAlign: "center",
                  }}
                >
                  ···
                </span>
              </div>
            );
          case "":
            return (
              <div
                className="qbitTitle"
                style={{ height: height + "px" }}
              ></div>
            );
          default:
            return (
              <div className="qbitTitle" style={{ height: height + "px" }}>
                <span
                  className="title-q"
                  style={{
                    height: height + "px",
                    lineHeight: height + "px",
                    fontSize: fontSize.toString() + "px",
                    textAlign: "center",
                  }}
                >
                  {/* {"Qubit " + (item == "..." ? "···" : item)} */}q
                </span>
                <span
                  className="title-num"
                  style={{
                    verticalAlign: alignment,
                    fontSize: (fontSize / 2).toString() + "px",
                  }}
                >
                  {" " + item}
                </span>
              </div>
            );
        }
      })}
    </div>
  );
};

export default BitsName;
