import { useEffect } from "react";
import "./index.scss";

export interface BitsNameProps {
  qbitLengths: string[];
  alignment: string;
}

const BitsName = (props: BitsNameProps) => {
  const { qbitLengths, alignment } = props;

  return (
    <div className="bitsName">
      {qbitLengths.map((item) => {
        switch (item) {
          case "···":
            return (
              <div className="qbitTitle">
                <span className="title-q">···</span>
              </div>
            );
          case "":
            return <div className="qbitTitle"></div>;
          default:
            return (
              <div className="qbitTitle">
                <span className="title-q">q</span>
                <span
                  className="title-num"
                  style={{ verticalAlign: alignment }}
                >
                  {item}
                </span>
              </div>
            );
        }
      })}
    </div>
  );
};

export default BitsName;
