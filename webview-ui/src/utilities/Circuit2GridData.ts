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

  for (let col = 0; col < cols; col++) {
    var layer: number[] = [];
    for (let row = 0; row < rows; row++) {
      layer.push(0);
    }
    graph.push(layer);
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
    if (end < start) {
      start = yRange[1];
      end = yRange[0];
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
        for (let index = start; index < end; index++) {
          graph[xRange[0]][index] = opDict["vertical_line"];
        }
        const ctrl_bit = yRange[0];
        const target_bit = yRange[yRange.length - 1];
        if (ctrl_bit < target_bit) {
          graph[xRange[0]][ctrl_bit] = opDict["ctrl_up"];
          graph[xRange[0]][target_bit] = opDict["cx_down"];
        } else {
          graph[xRange[0]][ctrl_bit] = opDict["ctrl_down"];
          graph[xRange[0]][target_bit] = opDict["cx_up"];
        }

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
              graph[xRange[0]][yRange[1]] = opDict["single_gate_bottom"];
              break;
            default:
              for (let index = start; index < end; index++) {
                graph[xRange[0]][index] = opDict["single_gate_middle"];
              }
              graph[xRange[0]][start] = opDict["single_gate_up"];
              graph[xRange[0]][yRange[1]] = opDict["single_gate_bottom"];
              break;
          }
          graphText.push({
            x: xRange,
            y: yRange,
            content: op.substring(1),
          });
        }
        break;
    }
  });

  return { graph, graphText };
};

export default Circuit2GridData;
