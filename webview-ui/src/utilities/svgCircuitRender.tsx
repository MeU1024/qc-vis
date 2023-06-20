import * as d3 from "d3";
import {
  colorDict,
  GATE_FILL,
  GATE_FILL_OPACITY,
  IDLE_FILL,
  IDLE_STROKE,
  MATRIX_BG,
  opTypeDict,
  PARA_HIGH_FILL,
  PARA_LOW_FILL,
  SINGLE_GATE_STROKE,
  WIRE_STROKE,
} from "../const";

export interface svgCircuitRenderProps {
  id: string;
  width: number;
  height: number;
  gridSize: number;
  circuit: {
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: ((number | number[])[] | (number | number[])[][])[];
  };
  averageIdleValue: number[][];
  idlePosition: number[][][];
  focusIndex: number | undefined;
  focusLayer: number | undefined;
  offsetX: number;
  offsetY: number;
  layerRangeStart: number;
  qubitRangeStart: number;
  layerPosition: number[];
  wiresData: number[];
  gridNumber: number;
  layerNumber: number;
  posLayerMap: number[];
  layerPosMap: number[];
  layerWidth: number[];
}

const colorScale = d3
  .scaleLinear<string>()
  .domain([0, 1])
  .range([PARA_LOW_FILL, PARA_HIGH_FILL]);

export const svgCircuitRender = (props: svgCircuitRenderProps) => {
  const {
    circuit,
    width,
    height,
    gridSize,
    averageIdleValue,
    idlePosition,
    focusIndex,
    offsetX,
    offsetY,
    layerRangeStart,
    qubitRangeStart,
    layerPosition,
    wiresData,
    focusLayer,
    gridNumber,
    layerNumber,
    posLayerMap,
    layerPosMap,
    layerWidth,
  } = props;

  // const wiresData = [0, 0.2, 0.6, 1, 0.4, 0, 0];

  var svg = d3.select(props.id);
  svg.selectAll("*").remove();

  var averageLayer = svg.append("g");
  var wiresLayer = svg.append("g");
  var gatesLayer = svg.append("g");
  var focusFrameLayer = svg.append("g");
  if (
    focusLayer !== undefined &&
    focusIndex !== undefined &&
    averageIdleValue !== undefined &&
    idlePosition !== undefined
  ) {
    if (averageIdleValue.length !== 0) {
      const slicedAverageIdleValue = averageIdleValue[focusLayer].slice(
        qubitRangeStart,
        qubitRangeStart + gridNumber
      );
      var rects = averageLayer
        .selectAll("rect")
        .data(slicedAverageIdleValue)
        .enter();

      rects
        .append("rect")
        .attr("x", (d) => layerPosMap[focusLayer] * gridSize + offsetX)
        .attr("y", (d, i) => i * gridSize)
        .attr("width", gridSize * layerWidth[focusLayer])
        .attr("height", gridSize)
        .attr("fill", IDLE_FILL)
        .attr("fill-opacity", (d) => d);
    }

    if (idlePosition[focusLayer].length !== 0) {
      // console.log(idlePosition[layerPosition[focusIndex]]);

      const slicedIdlePosition = idlePosition[focusLayer].slice(
        qubitRangeStart,
        qubitRangeStart + gridNumber
      );
      console.log("slicedIdlePosition", slicedIdlePosition);

      const idleBackground = averageLayer
        .selectAll("g")
        .data(slicedIdlePosition)
        .enter()
        .append("g");

      console.log("layerWidth", layerWidth);

      idleBackground.each((d, index) => {
        const rectWidth = d.reduce((sum, curIndex) => {
          return sum + layerWidth[curIndex];
        }, 0);
        // console.log("rectWidth", rectWidth);
        let bg = d3.select(idleBackground.nodes()[index]).append("rect");
        bg.attr("x", layerPosMap[d[0]] * gridSize + offsetX)
          .attr("y", index * gridSize)
          .attr("width", gridSize * rectWidth)
          .attr("height", gridSize)
          .attr("rx", gridSize / 20)
          .attr("fill", IDLE_FILL)
          .attr("fill-opacity", 0.15);
      });
    }
  }

  var gradient = svg
    .append("defs")
    .append("linearGradient")
    .attr("id", "myWireGradient");
  // console.log("wiresData", wiresData);
  for (let i = 0; i < wiresData.length; i++) {
    gradient
      .append("stop")
      .attr("offset", (i / wiresData.length).toString())
      .attr("stop-color", colorScale(wiresData[i]));
  }

  //wire
  var wires = wiresLayer.selectAll("rect").data(wiresData).enter();
  wires
    .append("rect")
    .attr("x", 0)
    .attr("y", function (d, i) {
      return i * gridSize + gridSize / 2;
    })
    .attr("width", width)
    .attr("height", 1)
    .style("fill", (d, i) => {
      return "url(#myWireGradient)";
    });
  for (let index = 0; index < gridNumber; index++) {}

  //gate
  const allGates = circuit.all_gates;
  const opMap = circuit.op_map;

  console.log("svg circuit allgates", allGates);
  console.log("svg opmap", opMap);

  var gates = gatesLayer.selectAll("g").data(allGates).enter().append("g");
  gates.each((gate: any, index) => {
    let shape;

    const opList = Object.keys(opMap);
    const op = opList[gate[0]];
    const layer = gate[1][0];
    const qubits = gate[2];
    const x = layer;
    const y = qubits[qubits.length - 1];
    const control_y = qubits[0];
    let diff = control_y - y > 0 ? -1 : 1;

    let gateName = op;
    let gateType = "empty";
    if (op[0] == "_") {
      gateType = "customized";
      gateName = gateName.slice(1);
    } else {
      gateType = opTypeDict[op];
    }

    //gate drawing
    if (
      gateType === "single" ||
      gateType === "customized" ||
      (gateType === "multi" && op !== "cz" && op !== "cp" && op != "swap") ||
      op == "ccx"
      // op == "ryy"
    ) {
      shape = d3.select(gates.nodes()[index]).append("rect");
      shape
        .attr("x", x * gridSize + (gridSize / 16) * 3 + offsetX)
        .attr("y", y * gridSize + (gridSize / 16) * 3 + offsetY)
        .attr("width", (gridSize / 8) * 5)
        .attr("height", (gridSize / 8) * 5)
        .attr("rx", gridSize / 20)
        .attr("stroke", colorDict[gateType])
        .attr("fill", GATE_FILL)
        .attr("fill-opacity", GATE_FILL_OPACITY);

      if (gridSize >= 15) {
        shape = d3.select(gates.nodes()[index]).append("text");
        shape
          .style("font-size", (gridSize / 3).toString() + "px")
          .attr("x", x * gridSize + gridSize / 2 + offsetX)
          .attr("y", y * gridSize + gridSize / 2 + gridSize / 3 / 4 + offsetY)
          .text(gateName)
          .attr("text-anchor", "middle")
          .style("fill", colorDict[gateType]);
      }
    }

    if (gateType == "double") {
      shape = d3.select(gates.nodes()[index]).append("rect");
      shape
        .attr("x", x * gridSize + (gridSize / 16) * 3 + offsetX)
        .attr("y", qubits[0] * gridSize + (gridSize / 16) * 3 + offsetY)
        .attr("width", (gridSize / 8) * 5)
        .attr("height", (gridSize / 8) * 5 + (y - control_y) * gridSize)
        .attr("rx", gridSize / 20)
        .attr("stroke", colorDict[gateType])
        .attr("fill", GATE_FILL)
        .attr("fill-opacity", GATE_FILL_OPACITY);

      if (gridSize >= 15) {
        shape = d3.select(gates.nodes()[index]).append("text");
        shape
          .style("font-size", (gridSize / 3).toString() + "px")
          .attr("x", x * gridSize + gridSize / 2 + offsetX)
          .attr(
            "y",
            ((y + control_y) / 2) * gridSize +
              gridSize / 2 +
              gridSize / 3 / 4 +
              offsetY
          )
          .text(gateName)
          .attr("text-anchor", "middle")
          .style("fill", colorDict[gateType]);
      }
    }

    switch (op) {
      case "cx":
      case "cy":
      case "crz":
      case "ch":
      case "cu":
      case "cry":
        shape = d3.select(gates.nodes()[index]).append("line");
        shape
          .attr("x1", x * gridSize + gridSize / 2 + offsetX)
          .attr("y1", control_y * gridSize + gridSize / 2 + offsetY)
          .attr("x2", x * gridSize + gridSize / 2 + offsetX)
          .attr(
            "y2",
            y * gridSize + gridSize / 2 - (gridSize / 16) * 5 * diff + offsetY
          )
          .attr("stroke", colorDict[gateType]);

        shape = d3.select(gates.nodes()[index]).append("circle");
        shape
          .attr("cx", x * gridSize + gridSize / 2 + offsetX)
          .attr("cy", control_y * gridSize + gridSize / 2 + offsetY)
          .attr("r", gridSize / 20)
          .attr("fill", colorDict[gateType]);
        break;
      case "ryy":
        break;
      case "cz":
      case "cp":
        shape = d3.select(gates.nodes()[index]).append("line");
        shape
          .attr("x1", x * gridSize + gridSize / 2 + offsetX)
          .attr("y1", control_y * gridSize + gridSize / 2 + offsetY)
          .attr("x2", x * gridSize + gridSize / 2 + offsetX)
          .attr("y2", y * gridSize + gridSize / 2 + offsetY)
          .attr("stroke", colorDict[gateType]);

        shape = d3.select(gates.nodes()[index]).append("circle");
        shape
          .attr("cx", x * gridSize + gridSize / 2 + offsetX)
          .attr("cy", control_y * gridSize + gridSize / 2 + offsetY)
          .attr("r", gridSize / 20)
          .attr("fill", colorDict[gateType]);

        shape = d3.select(gates.nodes()[index]).append("circle");
        shape
          .attr("cx", x * gridSize + gridSize / 2 + offsetX)
          .attr("cy", y * gridSize + gridSize / 2 + offsetY)
          .attr("r", gridSize / 20)
          .attr("fill", colorDict[gateType]);
        break;
      case "ccx":
        shape = d3.select(gates.nodes()[index]).append("line");
        shape
          .attr("x1", x * gridSize + gridSize / 2 + offsetX)
          .attr("y1", control_y * gridSize + gridSize / 2 + offsetY)
          .attr("x2", x * gridSize + gridSize / 2 + offsetX)
          .attr(
            "y2",
            y * gridSize + gridSize / 2 - (gridSize / 16) * 5 * diff + offsetY
          )
          .attr("stroke", colorDict[gateType]);

        shape = d3.select(gates.nodes()[index]).append("circle");
        shape
          .attr("cx", x * gridSize + gridSize / 2 + offsetX)
          .attr("cy", qubits[0] * gridSize + gridSize / 2 + offsetY)
          .attr("r", gridSize / 20)
          .attr("fill", colorDict[gateType]);

        shape = d3.select(gates.nodes()[index]).append("circle");
        shape
          .attr("cx", x * gridSize + gridSize / 2 + offsetX)
          .attr("cy", qubits[1] * gridSize + gridSize / 2 + offsetY)
          .attr("r", gridSize / 20)
          .attr("fill", colorDict[gateType]);
        break;
      case "swap":
        shape = d3.select(gates.nodes()[index]).append("line");
        shape
          .attr("x1", x * gridSize + gridSize / 2 + offsetX)
          .attr("y1", control_y * gridSize + gridSize / 2 + offsetY)
          .attr("x2", x * gridSize + gridSize / 2 + offsetX)
          .attr("y2", y * gridSize + gridSize / 2 + offsetY)
          .attr("stroke", colorDict[gateType]);
        qubits.forEach((qubitIndex: number) => {
          shape = d3.select(gates.nodes()[index]).append("line");
          shape
            .attr("x1", x * gridSize + (gridSize / 8) * 3 + offsetX)
            .attr("y1", qubitIndex * gridSize + (gridSize / 8) * 3 + offsetY)
            .attr("x2", x * gridSize + (gridSize / 8) * 5 + offsetX)
            .attr("y2", qubitIndex * gridSize + (gridSize / 8) * 5 + offsetY)
            .attr("stroke", colorDict[gateType]);

          shape = d3.select(gates.nodes()[index]).append("line");
          shape
            .attr("x1", x * gridSize + (gridSize / 8) * 3 + offsetX)
            .attr("y1", qubitIndex * gridSize + (gridSize / 8) * 5 + offsetY)
            .attr("x2", x * gridSize + (gridSize / 8) * 5 + offsetX)
            .attr("y2", qubitIndex * gridSize + (gridSize / 8) * 3 + offsetY)
            .attr("stroke", colorDict[gateType]);
        });
        break;
      case "cswap":
        shape = d3.select(gates.nodes()[index]).append("line");
        shape
          .attr("x1", x * gridSize + gridSize / 2 + offsetX)
          .attr("y1", control_y * gridSize + gridSize / 2 + offsetY)
          .attr("x2", x * gridSize + gridSize / 2 + offsetX)
          .attr("y2", y * gridSize + gridSize / 2 + offsetY)
          .attr("stroke", colorDict[gateType]);

        shape = d3.select(gates.nodes()[index]).append("circle");
        shape
          .attr("cx", x * gridSize + gridSize / 2 + offsetX)
          .attr("cy", control_y * gridSize + gridSize / 2 + offsetY)
          .attr("r", gridSize / 20)
          .attr("fill", colorDict[gateType]);
        qubits.forEach((qubitIndex: number) => {
          if (qubitIndex !== 0) {
            shape = d3.select(gates.nodes()[index]).append("line");
            shape
              .attr("x1", x * gridSize + (gridSize / 8) * 3 + offsetX)
              .attr("y1", qubitIndex * gridSize + (gridSize / 8) * 3 + offsetY)
              .attr("x2", x * gridSize + (gridSize / 8) * 5 + offsetX)
              .attr("y2", qubitIndex * gridSize + (gridSize / 8) * 5 + offsetY)
              .attr("stroke", colorDict[gateType]);

            shape = d3.select(gates.nodes()[index]).append("line");
            shape
              .attr("x1", x * gridSize + (gridSize / 8) * 3 + offsetX)
              .attr("y1", qubitIndex * gridSize + (gridSize / 8) * 5 + offsetY)
              .attr("x2", x * gridSize + (gridSize / 8) * 5 + offsetX)
              .attr("y2", qubitIndex * gridSize + (gridSize / 8) * 3 + offsetY)
              .attr("stroke", colorDict[gateType]);
          }
        });

        break;
      default:
        break;
    }
  });

  //focusLayer frame
  if (focusLayer !== undefined) {
    var frame = focusFrameLayer.selectAll("rect").data([focusLayer]).enter();
    frame
      .append("rect")
      .attr("x", (d) => layerPosMap[d] * gridSize + offsetX)
      .attr("y", 0)
      .attr("width", (d) => gridSize * layerWidth[d])
      .attr("height", height)
      .attr("stroke", IDLE_STROKE)
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("stroke-dasharray", "5,5");
  }
};
export interface svgCircuitBackgroundRenderProps {
  id: string;
  width: number;
  height: number;
  gridSize: number;
  averageIdleValue: number[];
  idleQubit: number[][];
  focusIndex: number | undefined;
  offsetX: number;
  offsetY: number;
  layerRangeStart: number;
  layerPosition: number[];
}
export const svgCircuitBackgroundRender = () => {};
