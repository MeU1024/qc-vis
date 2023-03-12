import { useState, useEffect } from "react";
import "./index.scss";
import * as d3 from "d3";

export interface ConnectivityPanelProps {
  theme: any;
  highlightGate: string | null;
}
const ConnectivityPanel = (props: ConnectivityPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Connectivity");
  const [matrix, setMatrix] = useState(matrixData());
  const [rectSize, setRectSize] = useState(20);

  useEffect(() => {
    var svg = d3.select("#matrixSVG");

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
          return d[index] ? "balck" : "white";
        })
        .attr("stroke", "gray");
    }
  }, [matrix]);

  return (
    <div className="panel" id="connectivityPanel">
      <div className="panelHeader first">{panelTitle}</div>
      <div className="legend">
        <span className="legendName">Linked</span>
        <svg viewBox="0 0 8 8" width="8" height="8">
          <rect width="8" height="8" />
        </svg>
        <span className="legendName">Unlinked</span>
        <svg viewBox="0 0 8 8" width="8" height="8">
          <rect width="8" height="8" />
        </svg>
      </div>
      <div className="matrix">
        <svg
          id="matrixSVG"
          viewBox="0 0 400 400"
          width="400"
          height="400"
        ></svg>
      </div>
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
    }
  }
  return connectivityMatrix;
};

export default ConnectivityPanel;
