import { useState, useEffect, useRef } from "react";
import "./index.scss";
import * as d3 from "d3";
import {
  IDLE_FILL,
  IDLE_STROKE,
  PARA_HIGH_FILL,
  PARA_LOW_FILL,
  WIRE_STROKE,
} from "../../const";
import overviewData_abs from "../../../data/vqc-10-detail-abstract.json";
import Circuit2GridData from "../../utilities/Circuit2GridData";
import { svgCircuitRender } from "../../utilities/svgCircuitRender";
import { extentRender } from "../../utilities/extentRender";
import { vscode } from "../../utilities/vscode";
import G from "glob";
import { style } from "d3";
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
  const [canvasWidth, setCanvasWidth] = useState(512);
  const [canvasHeight, setCanvasHeight] = useState(320);
  const [extentWidth, setExtentWidth] = useState(40);
  const [gridNumber, setGridNumber] = useState(10);
  const [layerNumber, setLayerNumber] = useState(16);
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
  const [originalParaData, setOriginalParaBarData] = useState<
    number[] | undefined
  >(undefined);
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

  const [graphSize, setGraphSize] = useState([10, 16]);
  const [threshold, setThreshold] = useState(5);
  const thresholdBarWidth = 150;
  const paraBarwidth = 577;
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
    gridNumber: number,
    layerNumber: number
  ) => {
    const new_gates: any[] = [];
    originalCircuit.all_gates.forEach((gateInfo: any) => {
      const qubitRange = gateInfo[2];
      const minQubit = Math.min(qubitRange);
      const maxQubit = Math.max(qubitRange);
      const layerRange = gateInfo[1];

      if (
        !(maxQubit < qubitRangeStart) &&
        !(minQubit > qubitRangeStart + gridNumber) &&
        layerRange[0] >= layerRangeStart &&
        layerRange[0] < layerRangeStart + layerNumber
      ) {
        new_gates.push(gateInfo);
      }
    });

    return {
      output_size: [gridNumber, layerNumber],
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
    setGridSize(canvasHeight / gridNumber);
  }, [gridNumber]);

  useEffect(() => {
    //TODO:REMOVE OVERLAP
    if (originalCircuit !== undefined) {
      const subCircuit = getSubCircuit(
        qubitRangeStart,
        layerPosMap[layerRangeStart],
        originalCircuit,
        gridNumber,
        layerNumber
      );

      const layerPositionList = posLayerMap.slice(
        layerPosMap[layerRangeStart],
        layerPosMap[layerRangeStart] + layerNumber
      );

      setSubCircuit(subCircuit);
      console.log("layerPosition", layerPositionList);
      setLayerPosition(layerPositionList);
    }
  }, [
    qubitRangeStart,
    layerRangeStart,
    originalCircuit,
    gridNumber,
    layerNumber,
  ]);

  useEffect(() => {
    if (focusIndex !== undefined) {
      console.log(layerPosition[focusIndex]);
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
        layerNumber: layerNumber,
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
        layerNumber: layerNumber,
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
    layerNumber,
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

    const layerRange = [layerRangeStart, layerRangeStart + layerNumber];
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
  }, [paraBarData, layerRangeStart, gridNumber, layerNumber]);

  useEffect(() => {
    var svg = d3.select("#thresholdBar");
    svg.selectAll("*").remove();
    const rectNumber = graphSize[0];
    const elementWidth = thresholdBarWidth - 5;
    const rectWidth = elementWidth / rectNumber;

    let recsData = new Array<number>(2).fill(0);
    recsData[1] = threshold;
    recsData[0] = rectNumber;
    const rects = svg.selectAll("rect").data(recsData);

    rects
      .enter()
      .append("rect")
      .attr("x", (d, i) => 0)
      .attr("y", paraBarheight / 4)
      .attr("rx", 4)
      .attr("width", (d, i) => d * rectWidth)
      .attr("height", paraBarheight / 2)
      .style("stroke", IDLE_STROKE)
      .style("stroke-width", 1)
      .style("fill", (d, i) => {
        return i === 0 ? "white" : IDLE_STROKE;
      });

    //lines for range vis

    // const thresholdRange = new Array<number>(rectNumber).fill(0);
    // var lines = svg.selectAll("line").data(thresholdRange);
    // lines
    //   .enter()
    //   .append("line")
    //   .attr("x1", (d, i) => (i * elementWidth) / graphSize[0])
    //   .attr("y1", paraBarheight / 4)
    //   .attr("x2", (d, i) => (i * elementWidth) / graphSize[0])
    //   .attr("y2", (paraBarheight / 4) * 3)
    //   .attr("stroke-width", "1px")
    //   .attr("stroke", IDLE_STROKE);

    var circles = svg.selectAll("circle").data([threshold]);
    circles
      .enter()
      .append("circle")
      .attr("cx", (d) => (d * elementWidth) / graphSize[0])
      .attr("cy", paraBarheight / 2)
      .attr("r", paraBarheight / 2)
      .attr("fill", IDLE_STROKE);
  }, [threshold]);

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
              100
            )
          );
          setLayerNumber((layerNumber) =>
            Math.min(
              Math.max(layerNumber + 1, 13),
              // originalCircuit?.output_size[0] || 20
              100
            )
          );
        } else {
          setGridNumber((gridNumber) =>
            Math.min(
              Math.max(gridNumber - 1, 7),
              100
              // originalCircuit?.output_size[0] || 20
            )
          );
          setLayerNumber((layerNumber) =>
            Math.min(
              Math.max(layerNumber - 1, 13),
              // originalCircuit?.output_size[0] || 20
              100
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
  }, [gridNumber, layerNumber, originalCircuit]);

  const filterParaData = (paraBarData: number[], qubitLength: number) => {
    const filteredData = paraBarData.map((data, index) => {
      const newValue = (data * qubitLength) / threshold;
      return newValue > 1 ? 1 : newValue;
    });

    return filteredData;
  };

  useEffect(() => {
    if (originalParaData !== undefined) {
      const paraData = filterParaData(originalParaData, graphSize[0]);
      setParaBarData(paraData);
    }
  }, [threshold, originalParaData]);

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

          setOriginalParaBarData(message.data.layerParallelism);

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
      layerStart + layerNumber <= graphSize[1]
        ? layerStart
        : graphSize[1] - layerNumber;
    layerStart = layerStart < 0 ? 0 : layerStart;
    setLayerRangeStart(layerStart);

    // vscode.postMessage({
    //   type: "layerRangeStart",
    //   layerRangeStart: layerStart,
    // });
  }

  function handleThresholdBarClick(event: any) {
    const rect =
      event.target.farthestViewportElement !== null
        ? event.target.farthestViewportElement.getBoundingClientRect()
        : event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    let threshold = Math.floor(x / ((thresholdBarWidth - 5) / graphSize[0]));
    console.log("threshold", threshold);
    setThreshold(threshold);
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

    let layerWidth = new Array(circuit.output_size[1]).fill(0);
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

      <div className="idle">
        <span className="idleWireExtent">
          <span className="legendTitle">Idle Wire Extent:</span>
          <span className="legendContent">To Left</span>
          <svg width="20" height="10" viewBox={"0 0 " + 10 + " " + 10}>
            <rect
              x="0"
              y="5"
              rx="0"
              ry="0"
              width="15"
              height="2"
              fill={WIRE_STROKE}
            />
            <line
              x1="15"
              x2="15"
              y1="0"
              y2="10"
              stroke={IDLE_STROKE}
              strokeWidth="2px"
            />
          </svg>
          <span className="legendContent">To Right</span>
          <svg width="20" height="10" viewBox={"0 0 " + 10 + " " + 10}>
            <rect
              x="2"
              y="5"
              rx="0"
              ry="0"
              width="15"
              height="2"
              fill={WIRE_STROKE}
            />
            <line
              x1="1"
              x2="1"
              y1="0"
              y2="10"
              stroke={IDLE_STROKE}
              strokeWidth="2px"
            />
          </svg>
        </span>
        <span className="idlePosition" style={{ paddingLeft: "10px" }}>
          <span className="legendTitle">Idle Position:</span>
          <svg
            id="idlePos"
            viewBox={"0 0 " + 10 + " " + 10}
            width={10}
            height={10}
          >
            <rect
              x="0"
              y="0"
              rx="0"
              ry="0"
              width="150"
              height="15"
              fill={IDLE_FILL}
            />
          </svg>
        </span>
        <span className="rangeView">
          <span className="selectRange">
            Qubit: {qubitRangeStart} - {qubitRangeStart + gridNumber - 1}{" "}
          </span>
          <span className="selectRange">
            Layer: {layerRangeStart} - {layerRangeStart + layerNumber - 1}{" "}
          </span>
        </span>
      </div>

      <div className="parallelismLevel">
        <span className="legendTitle">Parallelism Level:</span>
        <span className="contentLow"> Low </span>
        <span className="legend-svg">
          <svg width="85" height="10" viewBox={"0 0 " + 60 + " " + 5}>
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
              width="60"
              height="10"
              fill="url(#Gradient1)"
            />
          </svg>
        </span>
        <span className="contentHigh"> High </span>
        <span id="thresholdBarArea">
          <span className="legendTitle"> Threshold:</span>
          <span style={{ width: "30px" }}> {threshold} </span>
          <svg
            id="thresholdBar"
            viewBox={"0 0 " + thresholdBarWidth + " " + paraBarheight}
            width={thresholdBarWidth}
            height={paraBarheight}
            onClick={handleThresholdBarClick}
          ></svg>
          <span> {graphSize[0]} </span>
        </span>
      </div>

      {/* <div className="parallelism-legend">
        <div className="legend-title"></div>
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
            <div className="two-row-legend">
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
          </div>
          <div className="idel-level-legend"></div>
        </div>
      </div> */}

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
          {/* <svg
            id="idleBar"
            viewBox={"0 0 " + idleBarwidth + " " + idleBarheight}
            width={idleBarwidth}
            height={idleBarheight}
            onClick={handleIdleBarClick}
          ></svg> */}
        </div>

        <svg
          id="parallelismBar"
          viewBox={"0 0 " + paraBarwidth + " " + paraBarheight}
          width={paraBarwidth}
          height={paraBarheight}
          onClick={handleParaBarClick}
        ></svg>
      </div>
    </div>
  );
};

const generateCircuit = () => {
  return {
    output_size: [10, 16],
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
