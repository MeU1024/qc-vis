import { useState, useEffect } from "react";
import "./index.scss";
import * as d3 from "d3";
import { MATRIX_BG, MATRIX_STROKE } from "../../const";

export interface ConnectivityPanelProps {
  theme: any;
  highlightGate: string | null;
}
const ConnectivityPanel = (props: ConnectivityPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Connectivity");
  const [componentTitle, setComponentTitle] = useState("");
  const [matrix, setMatrix] = useState(matrixData());
  const [svgWidth, setSvgWidth] = useState(400);
  const [svgHeight, setSvgHeight] = useState(400);
  const [rectSize, setRectSize] = useState(20);

  useEffect(() => {
    var svg = d3.select("#matrixSVG");
    svg.selectAll("rect").remove();
    var rects = svg.selectAll("rect").data(matrix);

    for (let index = 0; index < matrix.length; index++) {
      rects
        .enter()
        .append("rect")
        .attr("x", function (d, i) {
          return index * rectSize;
        })
        .attr("y", function (d, i) {
          return i * rectSize;
        })
        .attr("width", rectSize)
        .attr("height", rectSize)
        .attr("fill", function (d, i) {
          return d[index] ? MATRIX_BG : "none";
        })
        .attr("stroke", MATRIX_STROKE);
    }
  }, [matrix, rectSize]);

  useEffect(() => {
    const rectSize = svgWidth / matrix.length;
    if (rectSize > 30) {
      setSvgWidth(matrix.length * 30);
      setSvgHeight(matrix.length * 30);
      setRectSize(30);
    }
  }, [matrix]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          setMatrix(message.data.matrix);

          break;
        case "context.setMatrix":
          setMatrix(message.matrix);
          setComponentTitle(message.title);

          break;
        // case "context.setTitle":
        //   setPanelTitle(message.data.title);
        //   break;
      }
    };
    window.addEventListener("message", handleMessageEvent);
    return () => {
      window.removeEventListener("message", handleMessageEvent);
    };
  }, []);

  return (
    <div className="panel" id="connectivityPanel">
      <div className="panelHeader first">{panelTitle}</div>
      <div className="legend">
        <span className="legendName">Linked</span>
        <svg viewBox="0 0 8 8" width="8" height="8">
          <rect width="8" height="8" fill={MATRIX_BG} stroke={MATRIX_STROKE} />
        </svg>
        <span className="legendName">Unlinked</span>
        <svg
          viewBox="0 0 8 8"
          width="8"
          height="8"
          fill="white"
          stroke={MATRIX_STROKE}
        >
          <rect width="8" height="8" />
        </svg>
      </div>
      <div className="matrix">
        <svg
          id="matrixSVG"
          viewBox={"0 0 " + svgWidth + " " + svgHeight}
          width={svgWidth}
          height={svgHeight}
        ></svg>
      </div>
      <div className="componentTitle">Component: {componentTitle}</div>
    </div>
  );
};

const matrixData = () => {
  const connectivityMatrix: number[][] = [];
  for (let row = 0; row < 20; row++) {
    connectivityMatrix[row] = new Array();
    for (let col = 0; col < 20; col++) {
      connectivityMatrix[row].push(0);
    }
  }
  for (let row = 0; row < 20; row++) {
    for (let col = row + 1; col < 20; col++) {
      connectivityMatrix[row][col] = 1;
      connectivityMatrix[col][row] = 1;
    }
  }
  return connectivityMatrix;
};

export default ConnectivityPanel;
