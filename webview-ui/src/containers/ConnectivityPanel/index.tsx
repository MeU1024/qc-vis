import { useState, useEffect } from "react";
import "./index.scss";
import * as d3 from "d3";
import { colorGroup, IDLE_STROKE, MATRIX_BG, MATRIX_STROKE } from "../../const";

export interface ConnectivityPanelProps {
  theme: any;
  highlightGate: string | null;
}
const ConnectivityPanel = (props: ConnectivityPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Connectivity");
  const [componentTitle, setComponentTitle] = useState("");
  const [matrix, setMatrix] = useState(matrixData());
  const [svgWidth, setSvgWidth] = useState(350);
  const [svgHeight, setSvgHeight] = useState(350);
  const [rectSize, setRectSize] = useState(20);
  const [focusQubit, setFocusQubit] = useState<number | undefined>(undefined);
  const [curEntGroup, setCurEntGroup] = useState<number[]>([]);
  const [preEntGroup, setPreEntGroup] = useState<number[]>([]);



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
        if (d < colorGroup.length) {
          return colorGroup[d];
        }
        else { // random color
          const letters = "0123456789ABCDEF";
          let color = "#";
          for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
          }
          return color;
        }
      });
    var circles = preLayer
      .selectAll("circle")
      .data(preEntGroup)
      .enter()
      .append("circle")
      .attr("cx", function (d, i) {
        return rectSize / 2 + i * rectSize;
      })
      .attr("cy", (rectSize / 8) * 8)
      .attr("r", rectSize / 4)
      .attr("fill", function (d, i) {
        if (d < colorGroup.length) {
          return colorGroup[d];
        }
        else { // random color
          const letters = "0123456789ABCDEF";
          let color = "#";
          for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
          }
          return color;
        }
      })
      .attr("fill-opacity", "50%");

    //legend
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
        case "context.setProvenance":
          setFocusQubit(message.data.focusQubit);
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

  useEffect(() => {
    var svg = d3.select("#matrixSVG");
    svg.selectAll("*").remove();
    var matrixLayer = svg.append("g");
    var frame = svg.append("g");

    if (focusQubit !== undefined) {
      frame
        .append("rect")
        .attr("x", function (d, i) {
          return 0;
        })
        .attr("y", function (d, i) {
          return focusQubit * rectSize;
        })
        .attr("width", svgWidth)
        .attr("height", rectSize)
        .attr("stroke-width", 1)
        .attr("stroke", "#606060")
        .attr("fill", "transparent");

      frame
        .append("rect")
        .attr("x", function (d, i) {
          return focusQubit * rectSize;
        })
        .attr("y", function (d, i) {
          return 0;
        })
        .attr("width", rectSize)
        .attr("height", svgWidth)
        .attr("stroke-width", 1)
        .attr("stroke", "#606060")
        .attr("fill", "transparent");
    }

    var rects = matrixLayer.selectAll("rect").data(matrix);
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
        .attr("stroke-width", 0.5)
        .attr("fill-opacity", function (d, i) {
          switch (d[index]) {
            case 1:
              return "30%";
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

  }, [matrix, rectSize, focusQubit]);

  return (
    <div className="panel" id="connectivityPanel">
      <div className="panelHeader">
        <span className="title">{panelTitle}</span>
      </div>
      <div className="legend">
        <span className="legendTitle" style={{ marginRight: "10px" }}>
          Link State:
        </span>
        <span className="legendName">New Link</span>
        <svg viewBox="0 0 10 10" width="10" height="10">
          <rect
            width="10"
            height="10"
            fill={MATRIX_BG}
            stroke={MATRIX_STROKE}
          />
        </svg>
        <span className="legendName">Linked</span>
        <svg viewBox="0 0 10 10" width="10" height="10">
          <rect
            width="10"
            height="10"
            fill={MATRIX_BG}
            stroke={MATRIX_STROKE}
            fillOpacity={"30%"}
          />
        </svg>
        <span className="legendName">No Link</span>
        <svg viewBox="0 0 10 10" width="10" height="10">
          <rect width="10" height="10" fill="white" stroke={"gray"} />
        </svg>
        <div className="entGroupLegend">
          <span className="legendTitle" style={{ marginRight: "10px" }}>
            Entanglement Group:
          </span>
          <span className="legendName">Group 1</span>
          <svg viewBox="0 0 10 10" width="10" height="10">
            <circle cx="5" cy="5" r="4" fill={colorGroup[1]} />
          </svg>
          <span className="legendName">Group 2</span>
          <svg viewBox="0 0 10 10" width="10" height="10">
            <circle cx="5" cy="5" r="4" fill={colorGroup[2]} />
          </svg>
        </div>
        <div className="component">
          <span className="componentTitle">Component: </span>
          <span className="componentName">{componentTitle}</span>
        </div>
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
  return connectivityMatrix;
};

export default ConnectivityPanel;
