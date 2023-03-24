import { useState, useEffect } from "react";
import "./index.scss";
import * as d3 from "d3";
import {
  IDLE_FILL,
  IDLE_STROKE,
  PARA_HIGH_FILL,
  PARA_LOW_FILL,
} from "../../const";
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

  const [panelTitle, setPanelTitle] = useState("Placement");
  const [idleBarwidth, setIdleBarwidth] = useState(40);
  const [idleBarheight, setIdleBarheight] = useState(360);
  const [canvasWidth, setCanvasWidth] = useState(350);
  const [canvasHeight, setCanvasHeight] = useState(350);
  const [gridNumber, setGridNumber] = useState(7);
  const [focusIndex, setFocusIndex] = useState<number | undefined>(undefined);
  const [focusLayer, setFocusLayer] = useState<number | undefined>(undefined);
  const [qubitRangeStart, setQubitRangeStart] = useState<number>(0);
  const [layerRangeStart, setLayerRangeStart] = useState<number>(0);
  const [subLayer, setSubLayer] = useState([0, 6]);
  const [layerPosition, setLayerPosition] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [gridSize, setGridSize] = useState(50);

  const [paraBarData, setParaBarData] = useState(geneParaData());
  const [originalCircuit, setOriginalCircuit] = useState<
    | {
      output_size: number[];
      op_map: {};
      qubits: string[];
      gate_format: string;
      all_gates: ((number | number[])[] | (number | number[])[])[];
    }
    | undefined
  >(generateCircuit());

  const [subCircuit, setSubCircuit] = useState<
    | {
      output_size: number[];
      op_map: {};
      qubits: string[];
      gate_format: string;
      all_gates: ((number | number[])[] | (number | number[])[])[];
    }
    | undefined
  >(generateCircuit());
  const [idlePosition, setIdlePosition] = useState<number[][][]>([
    [[3], [], [2, 3, 4]],
  ]);
  const [averageIdleValue, setAverageIdleValue] = useState<number[][]>([
    [0, 1, 0.5, 0.2, 0.4, 0.2, 0.1, 1, 1, 1],
  ]);

  const [graphSize, setGraphSize] = useState([10, 10]);
  const paraBarwidth = 360;
  const paraBarheight = 10;

  const colorScale = d3
    .scaleLinear<string>()
    .domain([0, 1])
    .range([PARA_LOW_FILL, PARA_HIGH_FILL]);

  const getSubCircuit = (
    qubitRangeStart: number,
    layerRangeStart: number,
    originalCircuit: {
      output_size: number[];
      op_map: {};
      qubits: string[];
      gate_format: string;
      all_gates: ((number | number[])[] | (number | number[])[])[];
    }
  ) => {
    const new_gates: any[] = [];
    originalCircuit.all_gates.forEach((gateInfo: any) => {
      const qubitRange = gateInfo[2];
      const layerRange = gateInfo[1];

      let index;
      for (index = 0; index < qubitRange.length; index++) {
        const element = qubitRange[index];
        if (
          element >= qubitRangeStart &&
          element < qubitRangeStart + gridNumber
        ) {
          break;
        }
      }
      if (
        index < qubitRange.length &&
        layerRange[0] >= layerRangeStart &&
        layerRange[0] < layerRangeStart + gridNumber
      ) {
        new_gates.push(gateInfo);
      }
    });

    return {
      output_size: [gridNumber, gridNumber],
      op_map: originalCircuit.op_map,
      qubits: originalCircuit.qubits.slice(
        qubitRangeStart,
        qubitRangeStart + gridNumber
      ),
      gate_format: "",
      all_gates: new_gates,
    };
  };

  useEffect(() => {
    //TODO:REMOVE OVERLAP
    if (originalCircuit !== undefined) {
      const subCircuit = getSubCircuit(
        qubitRangeStart,
        layerRangeStart,
        originalCircuit
      );
      // console.log("getsubcircuit", subCircuit);
      setSubCircuit(subCircuit);
    }

    const layerPositionList = [];
    for (
      let index = layerRangeStart;
      index < layerRangeStart + gridNumber;
      index++
    ) {
      layerPositionList.push(index);
    }
    console.log("list", layerPositionList);
    setLayerPosition(layerPositionList);
  }, [qubitRangeStart, layerRangeStart, originalCircuit]);

  useEffect(() => {
    if (focusIndex !== undefined) {
      console.log("layerPosition", layerPosition);
      console.log("focusIndex", focusIndex);
      setFocusLayer(layerPosition[focusIndex]);
    }
  }, [focusIndex]);
  useEffect(() => {
    if (subCircuit !== undefined) {
      // removeCircuitOverlap(circuit);
      // console.log("idlePosition", idlePosition);
      // console.log("averageIdleValue", averageIdleValue);
      svgCircuitRender({
        id: "#parallelismSVG",
        width: canvasWidth,
        height: canvasHeight,
        gridSize: 50,
        circuit: subCircuit,
        averageIdleValue: averageIdleValue,
        idlePosition: idlePosition,
        focusIndex: focusIndex,
        focusLayer: focusLayer,
        offsetX: -layerRangeStart * gridSize,
        offsetY: -qubitRangeStart * gridSize,
        layerRangeStart: layerRangeStart,
        qubitRangeStart: qubitRangeStart,
        layerPosition: layerPosition,
        wiresData: paraBarData.slice(
          layerRangeStart,
          layerRangeStart + gridNumber
        ),
      });
    }
  }, [
    subCircuit,
    averageIdleValue,
    layerRangeStart,
    qubitRangeStart,
    paraBarData,
    focusIndex,
    focusLayer,
    layerPosition,
  ]);

  useEffect(() => {
    if (averageIdleValue.length !== 0) {
      let layerIdleValue;
      if (focusLayer !== undefined) {
        layerIdleValue = averageIdleValue[focusLayer];
      } else {
        layerIdleValue = averageIdleValue[0];
      }

      var svg = d3.select("#idleBar");
      svg.selectAll("*").remove();
      const elementHeight = idleBarheight - 10;
      var rects = svg.selectAll("rect").data(layerIdleValue);

      rects
        .enter()
        .append("rect")
        .attr("x", idleBarwidth / 4) // Set the x-coordinate based on the data index
        .attr("y", function (d, i) {
          return (i * elementHeight) / layerIdleValue.length + 5;
        })
        .attr("width", idleBarwidth / 2)
        .attr("height", elementHeight / layerIdleValue.length)
        .attr("fill", IDLE_FILL)
        .attr("stroke", IDLE_FILL)
        .attr("stroke-width", "1px")
        .attr("fill-opacity", (d, i) => (d / 1.2).toString());

      //lines for range vis
      const qubitRange = [qubitRangeStart, qubitRangeStart + 7];
      var lines = svg.selectAll("line").data(qubitRange);
      lines
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("y1", (d) => (d * elementHeight) / layerIdleValue.length + 5)
        .attr("x2", idleBarwidth)
        .attr("y2", (d) => (d * elementHeight) / layerIdleValue.length + 5)
        .attr("stroke-width", "1px")
        .attr("stroke", "black");
    }
  }, [averageIdleValue, qubitRangeStart, focusLayer]);

  useEffect(() => {
    var svg = d3.select("#parallelismBar");
    svg.selectAll("*").remove();
    const rectNumber = graphSize[1];
    const elementWidth = paraBarwidth - 10;
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
      .attr("x", 5)
      .attr("y", paraBarheight / 4)
      .attr("width", elementWidth)
      .attr("height", paraBarheight / 2)
      .style("stroke-width", 0)
      .style("fill", "url(#myGradient)");

    //lines for range vis

    const layerRange = [layerRangeStart, layerRangeStart + 7];
    var lines = svg.selectAll("line").data(layerRange);
    lines
      .enter()
      .append("line")
      .attr("x1", (d) => (d * elementWidth) / graphSize[1] + 5)
      .attr("y1", 0)
      .attr("x2", (d) => (d * elementWidth) / graphSize[1] + 5)
      .attr("y2", paraBarheight)
      .attr("stroke-width", "1px")
      .attr("stroke", "black");
  }, [paraBarData, layerRangeStart]);

  useEffect(() => { }, []);
  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          setParaBarData(message.data.layerParallelism);
          // setCircuit(message.data.subCircuit);
          setAverageIdleValue(message.data.averageIdleValue);
          // setCurQubit(message.data.qubits);
          setGraphSize(message.data.originalCircuitSize);
          setSubLayer(message.data.subCircuit.subGraphLayerRange);
          setOriginalCircuit(message.data.originalCircuit);
          setIdlePosition(message.data.idlePosition);
          setAverageIdleValue(message.data.averageIdleValue);
          // console.log("context", message.data);
          break;
        case "context.setTitle":
          // setPanelTitle(message.data.title);
          break;
        case "context.setFocusData":
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
    const focusIndex = Math.floor(x / gridSize);
    setFocusIndex(focusIndex);
    vscode.postMessage({
      type: "focusGate",
      layer: layerPosition[focusIndex],
    });
  }

  function handleIdleBarClick(event: any) {
    const rect =
      event.target.farthestViewportElement !== null
        ? event.target.farthestViewportElement.getBoundingClientRect()
        : event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let qubitStart = Math.floor(
      (y - 5) / ((idleBarheight - 10) / graphSize[0])
    );
    qubitStart = qubitStart + 7 <= graphSize[0] ? qubitStart : graphSize[0] - 7;
    qubitStart = qubitStart < 0 ? 0 : qubitStart;
    setQubitRangeStart(qubitStart);

    // vscode.postMessage({
    //   type: "qubitRangeStart",
    //   qubitRangeStart: qubitStart,
    // });
  }

  function handleParaBarClick(event: any) {
    const rect =
      event.target.farthestViewportElement !== null
        ? event.target.farthestViewportElement.getBoundingClientRect()
        : event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;

    let layerStart = Math.floor((x - 5) / ((paraBarwidth - 10) / graphSize[1]));
    layerStart = layerStart + 7 <= graphSize[1] ? layerStart : graphSize[1] - 7;
    layerStart = layerStart < 0 ? 0 : layerStart;
    setLayerRangeStart(layerStart);

    vscode.postMessage({
      type: "layerRangeStart",
      layerRangeStart: layerStart,
    });
  }

  const removeCircuitOverlap = (circuit: {
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: ((number | number[])[] | (number | number[])[])[];
  }) => {
    const layerPosition: number[] = [];
    for (let index = subLayer[0]; index <= subLayer[1]; index++) {
      layerPosition.push(index);
    }

    // setLayerPosition(layerPosition);
    // console.log("layer pos", layerPosition);
    return;
  };

  return (
    <div className="panel parallelismPanel">

      <div className="panelHeader">
        <span className="title">{panelTitle}</span>
      </div>

      <div className="parallelismHori">
        <div className="parallelismTitle">
          <div>Idle Wire Extent:</div>
          <div>Parallelism Level:</div>
          <div>Idle Level:</div>
        </div>
        <div className="parallelismSvg">
          <div className="parallelismSvgAbove">
            <div>To Left</div>
            <svg width="15" height="15" version="1.1" xmlns="http://www.w3.org/2000/svg"
              viewBox={"0 0 " + 15 + " " + 15}
            >
              {/* <defs>
                <linearGradient id="Gradient1" >
                  <stop offset="0%" stop-color="#3FA9F5" />
                  <stop offset="100%" stop-color="#FF1D25" />
                </linearGradient>
              </defs> */}
              <rect x="0" y="0" rx="0" ry="0" width="15" height="15" fill="#FFFFFF" />
            </svg>
            <div>To Right</div>
          </div>
          <div className="parallelismSvgBlow">
            <div className="contentLow"> Low </div>
            <div>
              <div>
                <svg width="150" height="15" version="1.1" xmlns="http://www.w3.org/2000/svg"
                  viewBox={"0 0 " + 150 + " " + 15}
                >
                  <defs>
                    <linearGradient id="Gradient1" >
                      <stop offset="0%" stop-color="#3FA9F5" />
                      <stop offset="100%" stop-color="#FF1D25" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" rx="0" ry="0" width="150" height="15" fill="url(#Gradient1)" />
                </svg>
              </div>
              <div>
                <svg width="150" height="15" version="1.1" xmlns="http://www.w3.org/2000/svg"
                  viewBox={"0 0 " + 150 + " " + 15}
                >
                  <defs>
                    <linearGradient id="Gradient2" >
                      <stop offset="0%" stop-color="#FFFFFF" />
                      <stop offset="100%" stop-color="#BDCCD4" />
                    </linearGradient>
                  </defs>
                  <rect x="0" y="0" rx="0" ry="0" width="150" height="15" fill="url(#Gradient2)" />
                </svg>
              </div>
            </div>
            <div className="contentHigh"> High </div>
          </div>

        </div>
      </div>

      <div className="parallelismView">
        <div className="firstRow">
          {" "}
          <svg
            id="parallelismSVG"
            viewBox={"0 0 " + canvasWidth + " " + canvasHeight}
            width={canvasWidth}
            height={canvasHeight}
            onClick={handleClick}
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
          onClick={handleParaBarClick}
        ></svg>
        <div className="selectRange">
          Qubit Range: {qubitRangeStart} to {qubitRangeStart + 6}{" "}
        </div>
        <div className="selectRange">
          Layer Range: {layerRangeStart} to {layerRangeStart + 6}{" "}
        </div>
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
