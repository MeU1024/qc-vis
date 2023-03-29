import { useState, useEffect } from "react";
import "./index.scss";
import * as d3 from "d3";
import { colorGroup, MATRIX_BG, MATRIX_STROKE } from "../../const";

export interface ConnectivityPanelProps {
  theme: any;
  highlightGate: string | null;
}
const ConnectivityPanel = (props: ConnectivityPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Connectivity");
  const [componentTitle, setComponentTitle] = useState("");
  const [matrix, setMatrix] = useState(matrixData());
  const [svgWidth, setSvgWidth] = useState(360);
  const [svgHeight, setSvgHeight] = useState(360);
  const [rectSize, setRectSize] = useState(20);
  const [curEntGroup, setCurEntGroup] = useState<number[]>([]);
  const [preEntGroup, setPreEntGroup] = useState<number[]>([]);

  useEffect(() => {
    var svg = d3.select("#matrixSVG");
    svg.selectAll("rect").remove();
    var rects = svg.selectAll("rect").data(matrix);
    console.log("matrix", matrix);
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
        .attr("fill", MATRIX_BG)
        .attr("fill-opacity", function (d, i) {
          switch (d[index]) {
            case 1:
              return "50%";
            case 2:
              return "100%";
            case 0:
              return "0%";
            default:
              return "100%";
          }
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
    } else {
      setRectSize(rectSize);
    }
  }, [matrix]);

  useEffect(() => {
    var svg = d3.select("#entGroupSVG");
    svg.selectAll("*").remove();
    var preLayer = svg.append("g");
    var line = svg
      .append("line")
      .attr("x1", 0)
      .attr("y1", (rectSize / 4) * 3)
      .attr("x2", svgWidth)
      .attr("y2", (rectSize / 4) * 3)
      .attr("stroke", MATRIX_STROKE);
    var curLayer = svg.append("g");
    var circles = curLayer
      .selectAll("circle")
      .data(curEntGroup)
      .enter()
      .append("circle")
      .attr("cx", function (d, i) {
        return rectSize / 2 + i * rectSize;
      })
      .attr("cy", rectSize / 2)
      .attr("r", rectSize / 4)
      .attr("fill", function (d, i) {
        return colorGroup[d];
      });
    var circles = preLayer
      .selectAll("circle")
      .data(preEntGroup)
      .enter()
      .append("circle")
      .attr("cx", function (d, i) {
        return rectSize / 2 + i * rectSize;
      })
      .attr("cy", (rectSize / 8) * 7)
      .attr("r", rectSize / 4)
      .attr("fill", function (d, i) {
        return colorGroup[d];
      })
      .attr("fill-opacity", "50%");
  }, [preEntGroup, curEntGroup, rectSize]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          setMatrix(message.data.matrix);
          // setCurEntGroup(message.data.curEntGroup);
          // setPreEntGroup(message.data.preEntGroup);
          // console.log("curEntGroup", curEntGroup);
          break;
        case "context.setMatrix":
          setMatrix(message.data.matrix);
          console.log("curEntGroup", message.data.curEntGroup);
          console.log("preEntGroup", message.data.preEntGroup);

          setCurEntGroup(message.data.curEntGroup);
          setPreEntGroup(message.data.preEntGroup);

          setComponentTitle(message.data.title);

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
      <div className="panelHeader">
        <span className="title">{panelTitle}</span>
      </div>
      <div className="legend">
        <span className="legendName">Linked</span>
        <svg viewBox="0 0 8 8" width="8" height="8">
          <rect width="8" height="8" fill={MATRIX_BG} stroke={MATRIX_STROKE} />
        </svg>
        <span className="legendName">Unlinked</span>
        <svg viewBox="0 0 8 8" width="8" height="8">
          <rect width="8" height="8" fill="white" stroke={"black"} />
        </svg>
        <span className="componentTitle">Component: {componentTitle}</span>
      </div>
      <div className="matrix">
        <svg
          id="matrixSVG"
          viewBox={"0 0 " + svgWidth + " " + svgHeight}
          width={svgWidth}
          height={svgHeight}
        ></svg>
      </div>
      <div className="entGroup">
        <svg
          id="entGroupSVG"
          viewBox={"0 0 " + svgWidth + " " + 30}
          width={svgWidth}
          height={30}
        ></svg>
      </div>
    </div>
  );
};

const matrixData = () => {
  const connectivityMatrix: number[][] = [];
  for (let row = 0; row < 99; row++) {
    connectivityMatrix[row] = new Array();
    for (let col = 0; col < 99; col++) {
      connectivityMatrix[row].push(0);
    }
  }
  // for (let row = 0; row < 20; row++) {
  //   for (let col = row + 1; col < 20; col++) {
  //     connectivityMatrix[row][col] = 1;
  //     connectivityMatrix[col][row] = 1;
  //   }
  // }
  return connectivityMatrix;
};

export default ConnectivityPanel;
