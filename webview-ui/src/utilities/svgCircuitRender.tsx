import * as d3 from "d3";
import {
  colorDict,
  GATE_FILL,
  GATE_FILL_OPACITY,
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
}

const colorScale = d3
  .scaleLinear<string>()
  .domain([0, 1])
  .range([PARA_LOW_FILL, PARA_HIGH_FILL]);

export const svgCircuitRender = (props: svgCircuitRenderProps) => {
  const { circuit, width, height, gridSize } = props;

  const wiresData = [
    [0, 0.2, 0.6, 1, 0.4, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ];

  var svg = d3.select(props.id);
  svg.selectAll("*").remove();

  for (let index = 0; index < wiresData.length; index++) {
    var gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "myWireGradient" + index.toString());

    for (let i = 0; i < wiresData.length; i++) {
      gradient
        .append("stop")
        .attr("offset", (i / wiresData.length).toString())
        .attr("stop-color", colorScale(wiresData[index][i]));
    }
  }

  //wire
  var wires = svg.selectAll("wire").data(wiresData);
  wires
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", function (d, i) {
      return i * gridSize + gridSize / 2;
      5;
    })
    .attr("width", width)
    .attr("height", 1)
    .style("fill", (d, i) => {
      return "url(#myWireGradient" + i.toString() + ")";
    });

  //gate

  const allGates = circuit.all_gates;
  const opMap = circuit.op_map;

  var gates = svg.selectAll("g").data(allGates).enter().append("g");
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
      gateType === "multi"
    ) {
      shape = d3.select(gates.nodes()[index]).append("rect");
      shape
        .attr("x", x * gridSize + (gridSize / 16) * 3)
        .attr("y", y * gridSize + (gridSize / 16) * 3)
        .attr("width", (gridSize / 8) * 5)
        .attr("height", (gridSize / 8) * 5)
        .attr("rx", gridSize / 20)
        .attr("stroke", colorDict[gateType])
        .attr("fill", GATE_FILL)
        .attr("fill-opacity", GATE_FILL_OPACITY);

      shape = d3.select(gates.nodes()[index]).append("text");
      shape
        .style("font-size", (gridSize / 3).toString() + "px")
        .attr("x", x * gridSize + gridSize / 2)
        .attr("y", y * gridSize + gridSize / 2 + gridSize / 3 / 4)
        .text(gateName)
        .attr("text-anchor", "middle")
        .style("fill", colorDict[gateType]);
    }

    switch (op) {
      case "cx":
      case "cy":
        shape = d3.select(gates.nodes()[index]).append("line");
        shape
          .attr("x1", x * gridSize + gridSize / 2)
          .attr("y1", control_y * gridSize + gridSize / 2)
          .attr("x2", x * gridSize + gridSize / 2)
          .attr("y2", y * gridSize + gridSize / 2 - (gridSize / 16) * 5 * diff)
          .attr("stroke", colorDict[gateType]);

        shape = d3.select(gates.nodes()[index]).append("circle");
        shape
          .attr("cx", x * gridSize + gridSize / 2)
          .attr("cy", control_y * gridSize + gridSize / 2)
          .attr("r", gridSize / 20)
          .attr("fill", colorDict[gateType]);
        break;
      case "cz":
        break;
      default:
        break;
    }
  });
};
