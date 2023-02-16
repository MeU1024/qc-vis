import { useEffect } from "react";
import "./index.scss";

export interface BitsNameProps {
  qbitLengths: Number[];
}

const BitsName = (props: BitsNameProps) => {
  const { qbitLengths } = props;

  return (
    <div className="bitsName">
      {qbitLengths.map((item) => {
        return (
          <div className="qbitTitle">
            <span className="title-q">q</span>
            <span className="title-num">{item}</span>
          </div>
        );
      })}
    </div>
  );
};

export default BitsName;
