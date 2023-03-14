import { opDict } from "../const";
const Circuit2GridData = (circuitData: {
  output_size: number[];
  op_map: {};
  qubits: string[];
  gate_format: string;
  all_gates: any[];
}) => {
  const rows = circuitData.output_size[0];
  const cols = circuitData.output_size[1];
  const op_map = circuitData.op_map;
  const gateData = circuitData.all_gates;
  const qubits = circuitData.qubits;

  const graph: number[][] = [];
  const graphText: { x: number[]; y: number[]; content: string }[] = [];
  const lastCtrl: number[] = [];
  const pushLayer = 0;

  for (let col = 0; col < cols; col++) {
    var layer: number[] = [];
    for (let row = 0; row < rows; row++) {
      layer.push(0);
    }
    graph.push(layer);
  }
  for (let row = 0; row < rows; row++) {
    lastCtrl.push(0);
  }
  qubits.forEach((item, index) => {
    if (item == "···" || item == "...") {
      for (let col = 0; col < cols; col++) {
        graph[col][index] = opDict["empty"];
      }
    }
  });

  gateData.forEach((item) => {
    const opList = Object.keys(op_map);
    const op = opList[item[0]];
    const xRange: number[] = item[1];
    const yRange: number[] = item[2];
    var start = yRange[0];
    var end = yRange[yRange.length - 1];
    var gateRole = 0;
    if (end < start) {
      start = yRange[yRange.length - 1];
      end = yRange[0];
    }
    if (item.length == 4) {
      gateRole = item[3];
    }
    switch (op) {
      case "h":
      case "ry":
      case "rz":
      case "rx":
        graph[xRange[0]][yRange[0]] = opDict["single_gate"];
        graphText.push({ x: xRange, y: yRange, content: op });
        break;
      case "cz":
        for (let index = start; index < end; index++) {
          graph[xRange[0]][index] = opDict["vertical_line"];
        }
        graph[xRange[0]][yRange[0]] = opDict["ctrl_up"];
        graph[xRange[0]][yRange[yRange.length - 1]] = opDict["ctrl_down"];

        break;
      case "cx":
      case "cy":
        for (let index = start; index < end; index++) {
          graph[xRange[0]][index] = opDict["vertical_line"];
        }
        const ctrl_bit = yRange[0];
        const target_bit = yRange[yRange.length - 1];
        if (ctrl_bit < target_bit) {
          graph[xRange[0]][ctrl_bit] = opDict["ctrl_up"];
          graph[xRange[0]][target_bit] = opDict["cy_down"];
        } else {
          graph[xRange[0]][ctrl_bit] = opDict["ctrl_down"];
          graph[xRange[0]][target_bit] = opDict["cy_up"];
        }
        graphText.push({ x: xRange, y: [target_bit], content: op });
        break;
      case "...":
      case "···":
        graph[xRange[0]][yRange[0]] = opDict["empty"];
        graphText.push({ x: xRange, y: yRange, content: "···" });
        break;
      default:
        if (op[0] == "_") {
          switch (end - start) {
            case 0:
              graph[xRange[0]][yRange[0]] = opDict["custom_gate"];

              break;
            case 1:
              graph[xRange[0]][yRange[0]] = opDict["single_gate_up"];
              graph[xRange[0]][yRange[yRange.length - 1]] =
                opDict["single_gate_bottom"];
              break;
            default:
              for (let index = start; index < end; index++) {
                graph[xRange[0]][index] = opDict["single_gate_middle"];
              }
              graph[xRange[0]][start] = opDict["single_gate_up"];
              graph[xRange[0]][yRange[yRange.length - 1]] =
                opDict["single_gate_bottom"];
              break;
          }
          graphText.push({
            x: xRange,
            y: yRange,
            content: op,
          });
        }
        break;
    }
    if (gateRole == 1) {
      for (let row = start; row < end; row++) {
        for (let col = xRange[xRange.length - 1] + 1; col < cols; col++) {
          graph[col][row] = opDict["empty"];
        }
      }
      if (op == "cx" || op == "cy" || op == "cz") {
        if (xRange[xRange.length - 1] > lastCtrl[yRange[0]]) {
          lastCtrl[yRange[0]] = xRange[xRange.length - 1];
        }
      }
    }
  });
  for (let row = 0; row < rows; row++) {
    if (lastCtrl[row] !== 0) {
      for (let col = 0; col < lastCtrl[row] + 1; col++) {
        if (graph[col][row] == opDict["empty"]) {
          graph[col][row] = opDict["horizon_line"];
        }
      }
    }
  }
  return { graph, graphText };
};

const checkOverlap = () => {};
export default Circuit2GridData;
