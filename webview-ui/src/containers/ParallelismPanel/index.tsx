import { useState, useEffect } from "react";
import "./index.scss";
import * as d3 from "d3";
import { IDLE_FILL, PARA_HIGH_FILL, PARA_LOW_FILL } from "../../const";
import overviewData_abs from "../../../data/vqc-10-detail-abstract.json";
import Circuit2GridData from "../../utilities/Circuit2GridData";
import { svgCircuitRender } from "../../utilities/svgCircuitRender";
import { vscode } from "../../utilities/vscode";
export interface ParallelismPanelProps {
  theme: any;
  highlightGate: string | null;
}
const geneParaData = () => {
  return [0.1, 0, 3, 0.8, 0.5, 1, 0];
};
const ParallelismPanel = (props: ParallelismPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Idle Qubit | Parallelism");
  const [idleBarwidth, setIdleBarwidth] = useState(20);
  const [idleBarheight, setIdleBarheight] = useState(350);
  const [canvasWidth, setCanvasWidth] = useState(350);
  const [canvasHeight, setCanvasHeight] = useState(350);
  const [focusLayer, setFocusLayer] = useState<number | undefined>(undefined);
  const [qubitRangeStart, setQubitRangeStart] = useState<number>(0);

  const [gridSize, setGridSize] = useState(50);

  const [paraBarData, setParaBarData] = useState(geneParaData());

  const [circuit, setCircuit] = useState<
    | {
        output_size: number[];
        op_map: {};
        qubits: string[];
        gate_format: string;
        all_gates: ((number | number[])[] | (number | number[])[])[];
      }
    | undefined
  >(generateCircuit());
  const [idleQubit, setIdleQubit] = useState<number[][] | undefined>([
    [3],
    [],
    [2, 3, 4],
  ]);
  const [averageIdleValue, setAverageIdleValue] = useState<number[]>([]);
  const [curQubit, setCurQubit] = useState([]);
  const [qubitRange, setQubitRange] = useState([0, 7]);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const paraBarwidth = 350;
  const paraBarheight = 5;

  const colorScale = d3
    .scaleLinear<string>()
    .domain([0, 1])
    .range([PARA_LOW_FILL, PARA_HIGH_FILL]);

  useEffect(() => {
    console.log("circuit", circuit);
    if (circuit !== undefined && averageIdleValue !== undefined) {
      svgCircuitRender({
        id: "#parallelismSVG",
        width: canvasWidth,
        height: canvasHeight,
        gridSize: 50,
        circuit: circuit,
        averageIdleValue: averageIdleValue,
        idleQubit: idleQubit,
        focusLayer: focusLayer,
        offsetX: offsetX,
        offsetY: offsetY,
      });
    }
  }, [circuit, averageIdleValue]);

  useEffect(() => {
    if (averageIdleValue.length !== 0) {
      var svg = d3.select("#idleBar");
      svg.selectAll("*").remove();

      var rects = svg.selectAll("rect").data(averageIdleValue);

      rects
        .enter()
        .append("rect")
        .attr("x", 0) // Set the x-coordinate based on the data index
        .attr("y", function (d, i) {
          return (i * idleBarheight) / averageIdleValue.length;
        })
        .attr("width", idleBarwidth)
        .attr("height", idleBarheight / averageIdleValue.length)
        .attr("fill", IDLE_FILL)
        .attr("stroke", IDLE_FILL)
        .attr("stoke-width", "3px")
        .attr("fill-opacity", (d, i) => d.toString());
    }
  }, [averageIdleValue]);

  useEffect(() => {
    var svg = d3.select("#parallelismBar");
    svg.selectAll("*").remove();
    const rectNumber = paraBarData.length;
    const rectWidth = paraBarwidth / rectNumber;
    var gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "myGradient");

    for (let index = 0; index < rectNumber; index++) {
      gradient
        .append("stop")
        .attr("offset", (index / rectNumber).toString())
        .attr("stop-color", colorScale(paraBarData[index]));
    }

    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", paraBarwidth)
      .attr("height", paraBarheight)
      .style("stroke-width", 0)
      .style("fill", "url(#myGradient)");
  }, [paraBarData]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          setParaBarData(message.data.layerParallelism);
          setCircuit(message.data.subCircuit);
          setAverageIdleValue(message.data.averageIdleValue);
          setCurQubit(message.data.qubits);
          // console.log("circuit in msg", message.data.subCircuit);
          break;
        case "context.setTitle":
          setPanelTitle(message.data.title);
          break;
        case "context.setFocusData":
          setIdleQubit(message.data.idleQubit);

          setAverageIdleValue(message.data.averageIdleValue);

          break;
      }
    };
    window.addEventListener("message", handleMessageEvent);
    return () => {
      window.removeEventListener("message", handleMessageEvent);
    };
  }, []);

  function handleClick(event: any) {
    const rect =
      event.target.farthestViewportElement !== null
        ? event.target.farthestViewportElement.getBoundingClientRect()
        : event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const focusGate = Math.floor(x / gridSize);
    setFocusLayer(focusGate);
    vscode.postMessage({
      type: "focusGate",
      layer: focusGate,
    });
  }

  function handleIdleBarClick(event: any) {
    const rect =
      event.target.farthestViewportElement !== null
        ? event.target.farthestViewportElement.getBoundingClientRect()
        : event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const qubitStart = Math.floor(
      y / (idleBarheight / averageIdleValue.length)
    );
    setQubitRangeStart(qubitStart);

    setOffsetY(-qubitStart * gridSize);
    console.log(qubitStart);
    vscode.postMessage({
      type: "qubitRangeCenter",
      qubitRangeCenter: qubitStart,
    });
  }

  return (
    <div className="parallelismPanel">
      <div className="panelHeader">{panelTitle}</div>
      <div>Idle Wire Extent:</div>
      <div>Parallelism Level:</div>
      <div>Idle Level:</div>
      <div className="parallelismView">
        <div className="firstRow">
          {" "}
          <svg
            id="parallelismSVG"
            viewBox={"0 0 " + canvasWidth + " " + canvasHeight}
            width={canvasWidth}
            height={canvasHeight}
            onClick={(event) => {
              handleClick(event);
            }}
          ></svg>
          <svg
            id="idleBar"
            viewBox={"0 0 " + idleBarwidth + " " + idleBarheight}
            width={idleBarwidth}
            height={idleBarheight}
            onClick={handleIdleBarClick}
          ></svg>
        </div>
        <svg
          id="parallelismBar"
          viewBox={"0 0 " + paraBarwidth + " " + paraBarheight}
          width={paraBarwidth}
          height={paraBarheight}
        ></svg>
      </div>
    </div>
  );
};

const generateCircuit = () => {
  return {
    output_size: [7, 7],
    op_map: { null: 0, h: 1, cx: 2, cz: 3, ry: 4, rz: 5 },
    qubits: ["0", "1", "2", "3", "4", "5", "6"],
    gate_format: "[op_idx, x_range, y_range]",
    all_gates: [
      [1, [0], [0]],
      [1, [0], [1]],
      [1, [0], [2]],
      [1, [0], [3]],
      [1, [0], [4]],
      [1, [0], [5]],
      [1, [0], [6]],

      [5, [1], [0]],
      [5, [1], [1]],
      [5, [1], [2]],
      [5, [1], [3]],
      [5, [1], [4]],
      [5, [1], [5]],
      [5, [1], [6]],

      [2, [2], [0, 1]],
      [5, [3], [1]],
      [2, [4], [0, 1]],
      [2, [5], [1, 2]],
      [4, [5], [0]],
      [5, [6], [2]],
      [5, [6], [0]],
    ],
  };
};
export default ParallelismPanel;
