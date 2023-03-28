import { useState, useEffect, useRef } from "react";
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
import { extentRender } from "../../utilities/extentRender";
import { vscode } from "../../utilities/vscode";
export interface ParallelismPanelProps {
  theme: any;
  highlightGate: string | null;
}
const geneParaData = () => {
  return [0.1, 0, 3, 0.8, 0.5, 1, 0, 4, 0.5, 0.9, 0.4, 0.2];
};
const ParallelismPanel = (props: ParallelismPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Placement");
  const [idleBarwidth, setIdleBarwidth] = useState(30);
  const [idleBarheight, setIdleBarheight] = useState(360);
  const [canvasWidth, setCanvasWidth] = useState(320);
  const [canvasHeight, setCanvasHeight] = useState(320);
  const [extentWidth, setExtentWidth] = useState(40);
  const [gridNumber, setGridNumber] = useState(10);
  const [focusIndex, setFocusIndex] = useState<number | undefined>(undefined);
  const [focusLayer, setFocusLayer] = useState<number | undefined>(undefined);
  const [qubitRangeStart, setQubitRangeStart] = useState<number>(0);
  const [layerRangeStart, setLayerRangeStart] = useState<number>(0);
  const [subLayer, setSubLayer] = useState([0, 6]);
  const [layerPosition, setLayerPosition] = useState([0, 1, 2, 3, 4, 5, 6]);
  const [posLayerMap, setPosLayerMap] = useState<number[]>([
    0, 0, 1, 2, 3, 4, 5,
  ]);
  const [layerPosMap, setlayerPosMap] = useState<number[]>([0, 2, 3, 4, 5, 6]);
  const [layerWidth, setLayerWidth] = useState<number[]>([2, 1, 1, 1, 1, 1, 1]);
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
    [0, 1, 0.5, 0.2, 0.4, 0.2, 0.1, 1, 1, 1, 1, 1],
  ]);

  const [graphSize, setGraphSize] = useState([10, 10]);
  const [threshold, setThreshold] = useState(3);
  const paraBarwidth = 380;
  const paraBarheight = 10;
  const svgRef = useRef<SVGSVGElement>(null);

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
    },
    gridNumber: number
  ) => {
    const new_gates: any[] = [];
    originalCircuit.all_gates.forEach((gateInfo: any) => {
      const qubitRange = gateInfo[2];
      const minQubit = Math.min(qubitRange);
      const maxQubit = Math.max(qubitRange);
      const layerRange = gateInfo[1];

      // let index;
      // for (index = 0; index < qubitRange.length; index++) {
      //   const element = qubitRange[index];
      //   if (
      //     element >= qubitRangeStart &&
      //     element < qubitRangeStart + gridNumber
      //   ) {
      //     break;
      //   }
      // }
      if (
        !(maxQubit < qubitRangeStart) &&
        !(minQubit > qubitRangeStart + gridNumber) &&
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
    setGridSize(canvasWidth / gridNumber);
  }, [gridNumber]);

  useEffect(() => {
    //TODO:REMOVE OVERLAP
    if (originalCircuit !== undefined) {
      const subCircuit = getSubCircuit(
        qubitRangeStart,
        layerPosMap[layerRangeStart],
        originalCircuit,
        gridNumber
      );

      const layerPositionList = posLayerMap.slice(
        layerPosMap[layerRangeStart],
        layerPosMap[layerRangeStart] + gridNumber
      );

      setSubCircuit(subCircuit);
      console.log(layerPositionList);
      setLayerPosition(layerPositionList);
    }
  }, [qubitRangeStart, layerRangeStart, originalCircuit, gridNumber]);

  useEffect(() => {
    if (focusIndex !== undefined) {
      setFocusLayer(layerPosition[focusIndex]);
    }
  }, [focusIndex]);

  useEffect(() => {
    if (subCircuit !== undefined) {
      svgCircuitRender({
        id: "#parallelismSVG",
        width: canvasWidth,
        height: canvasHeight,
        gridSize: gridSize,
        circuit: subCircuit,
        averageIdleValue: averageIdleValue,
        idlePosition: idlePosition,
        focusIndex: focusIndex,
        focusLayer: focusLayer,
        offsetX: -layerPosMap[layerRangeStart] * gridSize,
        offsetY: -qubitRangeStart * gridSize,
        layerRangeStart: layerPosMap[layerRangeStart],
        qubitRangeStart: qubitRangeStart,
        layerPosition: layerPosition,
        wiresData: layerPosition.map((index) => {
          return paraBarData[index];
        }),
        gridNumber: gridNumber,
        posLayerMap: posLayerMap,
        layerPosMap: layerPosMap,
        layerWidth: layerWidth,
      });
      extentRender({
        width: canvasWidth,
        height: canvasHeight,
        gridSize: gridSize,
        circuit: subCircuit,
        averageIdleValue: averageIdleValue,
        idlePosition: idlePosition,
        focusIndex: focusIndex,
        focusLayer: focusLayer,
        offsetX: -layerPosMap[layerRangeStart] * gridSize,
        offsetY: -qubitRangeStart * gridSize,
        layerRangeStart: layerPosMap[layerRangeStart],
        qubitRangeStart: qubitRangeStart,
        layerPosition: layerPosition,

        paraBarData: paraBarData,
        gridNumber: gridNumber,
        posLayerMap: posLayerMap,
        layerPosMap: layerPosMap,
        layerWidth: layerWidth,
      });
    }
  }, [
    subCircuit,
    // averageIdleValue,
    layerRangeStart,
    qubitRangeStart,
    paraBarData,
    focusIndex,
    focusLayer,
    // layerPosition,
    gridNumber,
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
      const qubitRange = [qubitRangeStart, qubitRangeStart + gridNumber];
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
  }, [averageIdleValue, qubitRangeStart, focusLayer, gridNumber]);

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

    const layerRange = [layerRangeStart, layerRangeStart + gridNumber];
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
  }, [paraBarData, layerRangeStart, gridNumber]);

  useEffect(() => {
    const canvas = svgRef.current;

    const handleWheelEvent = (e: any) => {
      if (e.ctrlKey) {
        // console.log(gridNumber);
        e.preventDefault();
        let deltaScale = e.deltaY;
        // console.log(widthScale);
        if (deltaScale > 0) {
          setGridNumber((gridNumber) =>
            Math.min(
              Math.max(gridNumber + 1, 7),
              // originalCircuit?.output_size[0] || 20
              50
            )
          );
        } else {
          setGridNumber((gridNumber) =>
            Math.min(
              Math.max(gridNumber - 1, 7),
              50
              // originalCircuit?.output_size[0] || 20
            )
          );
        }
      } else {
        e.preventDefault();
        let deltaScale = e.deltaY;
        // console.log(widthScale);
        if (deltaScale > 0) {
          setQubitRangeStart((qubitRangeStart) =>
            Math.min(
              Math.max(qubitRangeStart + 1, 0),
              averageIdleValue[0].length - gridNumber
              // 50
            )
          );
        } else {
          setQubitRangeStart((qubitRangeStart) =>
            Math.min(
              Math.max(qubitRangeStart - 1, 0),
              averageIdleValue[0].length - gridNumber
              // 50
            )
          );
        }
      }
    };

    if (canvas) {
      canvas.addEventListener("wheel", handleWheelEvent);
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener("wheel", handleWheelEvent);
      }
    };
  }, [gridNumber, originalCircuit]);

  const filterParaData = (paraBarData: number[], qubitLength: number) => {
    const filteredData = paraBarData.map((data, index) => {
      return data * qubitLength > threshold ? 1 : data;
    });

    return filteredData;
  };

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          // setCircuit(message.data.subCircuit);
          setAverageIdleValue(message.data.averageIdleValue);
          // setCurQubit(message.data.qubits);
          setGraphSize(message.data.originalCircuitSize);
          setSubLayer(message.data.subCircuit.subGraphLayerRange);

          setIdlePosition(message.data.idlePosition);
          setAverageIdleValue(message.data.averageIdleValue);

          const paraData = filterParaData(
            message.data.layerParallelism,
            message.data.averageIdleValue.length
          );
          setParaBarData(paraData);

          // console.log("original circuit", message.data.originalCircuit);
          if (message.data.originalCircuit !== undefined) {
            const { noOverlapCircuit, layerPosMap, posLayerMap, layerWidth } =
              calculateIndexMap(message.data.originalCircuit);

            setlayerPosMap(layerPosMap);
            setPosLayerMap(posLayerMap);
            setOriginalCircuit(noOverlapCircuit);
            setLayerWidth(layerWidth);

            console.log("noOverlapCircuit", noOverlapCircuit);
          }
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
    // vscode.postMessage({
    //   type: "focusGate",
    //   layer: layerPosition[focusIndex],
    // });
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
    qubitStart =
      qubitStart + gridNumber <= graphSize[0]
        ? qubitStart
        : graphSize[0] - gridNumber;
    qubitStart = qubitStart < 0 ? 0 : qubitStart;
    setQubitRangeStart(qubitStart);
  }

  function handleParaBarClick(event: any) {
    const rect =
      event.target.farthestViewportElement !== null
        ? event.target.farthestViewportElement.getBoundingClientRect()
        : event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;

    let layerStart = Math.floor((x - 5) / ((paraBarwidth - 10) / graphSize[1]));
    layerStart =
      layerStart + gridNumber <= graphSize[1]
        ? layerStart
        : graphSize[1] - gridNumber;
    layerStart = layerStart < 0 ? 0 : layerStart;
    setLayerRangeStart(layerStart);

    // vscode.postMessage({
    //   type: "layerRangeStart",
    //   layerRangeStart: layerStart,
    // });
  }

  const calculateIndexMap = (circuit: {
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: ((number | number[])[] | (number | number[])[])[];
  }) => {
    const gatesInLayers: any[][] = [];
    const posLayerMap: number[] = [];
    const layerPosMap: number[] = [];

    circuit.all_gates.forEach((gateInfo: any) => {
      const layerIndex = gateInfo[1][0];

      if (gatesInLayers.length <= layerIndex) {
        gatesInLayers.push([gateInfo]);
      } else {
        gatesInLayers[layerIndex].push(gateInfo);
      }
    });

    const new_all_gates: any[] = [];
    let currentLayer = -1;
    for (
      let originLayerIndex = 0;
      originLayerIndex < gatesInLayers.length;
      originLayerIndex++
    ) {
      let ifOverlap = false;
      let qubitsPlacement = new Array(circuit.output_size[0]).fill(0);
      currentLayer++;
      layerPosMap.push(posLayerMap.length);
      posLayerMap.push(originLayerIndex);

      gatesInLayers[originLayerIndex].forEach((gateInfo: any) => {
        const qubitsIndex = gateInfo[2];
        let minQubit = Math.min(...qubitsIndex);
        let maxQubit = Math.max(...qubitsIndex);

        for (let index = minQubit; index <= maxQubit; index++) {
          if (qubitsPlacement[index] === 1) {
            ifOverlap = true;
            break;
          }
        }
        if (ifOverlap) {
          currentLayer++;
          posLayerMap.push(originLayerIndex);
          for (let index = 0; index < circuit.output_size[0]; index++) {
            qubitsPlacement[index] = 0;
          }
          for (let index = minQubit; index <= maxQubit; index++) {
            qubitsPlacement[index] = 1;
          }
          ifOverlap = false;
        } else {
          for (let index = minQubit; index <= maxQubit; index++) {
            qubitsPlacement[index] = 1;
          }
        }
        new_all_gates.push([gateInfo[0], [currentLayer], gateInfo[2]]);
      });
    }

    let layerWidth = new Array(circuit.output_size[0]).fill(0);
    posLayerMap.forEach((item) => {
      layerWidth[item]++;
    });

    const noOverlapCircuit = {
      output_size: [circuit.output_size[0], posLayerMap.length],
      op_map: circuit.op_map,
      qubits: circuit.qubits,
      gate_format: "",
      all_gates: new_all_gates,
    };

    return { noOverlapCircuit, layerPosMap, posLayerMap, layerWidth };
  };
  return (
    <div className="panel parallelismPanel">
      <div className="panelHeader">
        <span className="title">{panelTitle}</span>
      </div>

      <div className="parallelism-legend">
        <div className="legend-title">
          <div>Idle Wire Extent:</div>
          <div>Parallelism Level:</div>
          <div>Idle Level:</div>
        </div>
        <div className="legend-content">
          <div className="row one-row">
            <div>To Left</div>
            <svg width="15" height="15" viewBox={"0 0 " + 15 + " " + 15}>
              <rect
                x="0"
                y="0"
                rx="0"
                ry="0"
                width="15"
                height="15"
                fill="#FFFFFF"
              />
            </svg>
            <div>To Right</div>
          </div>
          <div className="row two-row">
            <div className="contentLow"> Low </div>
            <div className="two-row-legend">
              <div className="legend-svg">
                <svg width="150" height="15" viewBox={"0 0 " + 150 + " " + 15}>
                  <defs>
                    <linearGradient id="Gradient1">
                      <stop offset="0%" stop-color="#3FA9F5" />
                      <stop offset="100%" stop-color="#FF1D25" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="0"
                    y="0"
                    rx="0"
                    ry="0"
                    width="150"
                    height="15"
                    fill="url(#Gradient1)"
                  />
                </svg>
              </div>
              <div className="legend-svg">
                <svg width="150" height="15" viewBox={"0 0 " + 150 + " " + 15}>
                  <defs>
                    <linearGradient id="Gradient2">
                      <stop offset="0%" stop-color="#FFFFFF" />
                      <stop offset="100%" stop-color="#BDCCD4" />
                    </linearGradient>
                  </defs>
                  <rect
                    x="0"
                    y="0"
                    rx="0"
                    ry="0"
                    width="150"
                    height="15"
                    fill="url(#Gradient2)"
                  />
                </svg>
              </div>
            </div>
            <div className="contentHigh"> High </div>
          </div>
          <div className="idel-level-legend"></div>
        </div>
      </div>

      <div className="parallelismView">
        <div className="firstRow" style={{ marginTop: "10px" }}>
          <svg
            id="leftExtentSVG"
            viewBox={"0 0 " + extentWidth + " " + canvasHeight}
            width={extentWidth}
            height={canvasHeight}
          ></svg>
          <svg
            id="parallelismSVG"
            viewBox={"0 0 " + canvasWidth + " " + canvasHeight}
            width={canvasWidth}
            height={canvasHeight}
            ref={svgRef}
            onClick={handleClick}
          ></svg>
          <svg
            id="rightExtentSVG"
            viewBox={"0 0 " + extentWidth + " " + canvasHeight}
            width={extentWidth}
            height={canvasHeight}
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
          Qubit Range: {qubitRangeStart} to {qubitRangeStart + gridNumber - 1}{" "}
        </div>
        <div className="selectRange">
          Layer Range: {layerRangeStart} to {layerRangeStart + gridNumber - 1}{" "}
        </div>
      </div>
    </div>
  );
};

const generateCircuit = () => {
  return {
    output_size: [10, 10],
    op_map: { null: 0, h: 1, cx: 2, cz: 3, ry: 4, rz: 5, csw: 6 },
    qubits: ["0", "1", "2", "3", "4", "5", "6"],
    gate_format: "[op_idx, x_range, y_range]",
    all_gates: [
      [1, [0], [0]],
      [1, [0], [1]],
      [2, [0], [2, 8]],
      [1, [0], [3]],
      [1, [0], [4]],
      [1, [0], [5]],
      [1, [0], [6]],

      [3, [1], [0, 1]],
      [3, [1], [2, 3]],
      [3, [1], [4, 5]],
      [5, [1], [3]],
      [5, [1], [4]],
      [5, [1], [5]],
      [5, [1], [6]],

      [6, [2], [0, 2, 4]],
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
