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
    var secondEnd = yRange[yRange.length - 2];
    var gateRole = 0;
    if (end < start) {
      start = yRange[yRange.length - 1];
      end = yRange[0];
    }
    if (item.length == 4) {
      gateRole = item[3];
    }
    var ctrl_bit = yRange[0];
    var target_bit = yRange[yRange.length - 1];
    switch (op) {
      case "id":
        graph[xRange[0]][yRange[0]] = opDict["single_gate"];
        graphText.push({ x: xRange, y: yRange, content: "i" });
        break;
      case "h":
      case "x":
      case "y":
      case "z":
      case "p":
      case "s":
      case "sdg":
      case "t":
      case "tdg":
      case "i":
      case "u":
      case "ry":
      case "rz":
      case "rx":
        graph[xRange[0]][yRange[0]] = opDict["single_gate"];
        graphText.push({ x: xRange, y: yRange, content: op });
        break;
      case "cz":
      case "cp":
        for (let index = start; index < end; index++) {
          if (graph[xRange[0]][index] !== opDict["empty"]) {
            graph[xRange[0]][index] = opDict["vertical_line"];
          } else {
            graph[xRange[0]][index] = opDict["vertical_line_empty_bg"];
          }
        }
        if (ctrl_bit < target_bit) {
          graph[xRange[0]][ctrl_bit] = opDict["ctrl_up"];
          graph[xRange[0]][target_bit] = opDict["ctrl_down"];
        } else {
          graph[xRange[0]][ctrl_bit] = opDict["ctrl_down"];
          graph[xRange[0]][target_bit] = opDict["ctrl_up"];
        }

        break;
      case "ch":
      case "crz":
      case "cu":
      case "cx":
      case "cy":
      case "cry":
        for (let index = start; index < end; index++) {
          if (graph[xRange[0]][index] !== opDict["empty"]) {
            graph[xRange[0]][index] = opDict["vertical_line"];
          } else {
            graph[xRange[0]][index] = opDict["vertical_line_empty_bg"];
          }
          // graph[xRange[0]][index] = opDict["vertical_line"];
        }

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
      case "colDots":
        for (let index = 0; index < rows; index++) {
          // graph[xRange[0]][index] = opDict["horizon_line"];
          // graph[xRange[0]][index] = opDict["empty"];
        }
        // const midRowIndex = Math.floor(rows / 2);
        graph[xRange[0]][yRange[0]] = opDict["empty"];
        graphText.push({ x: xRange, y: yRange, content: "···" });
        break;
      case "ryy":
        graph[xRange[0]][yRange[0]] = opDict["ryy_gate_up"];
        graph[xRange[0]][yRange[yRange.length - 1]] = opDict["ryy_gate_bottom"];
        graphText.push({
          x: xRange,
          y: yRange,
          content: op,
        });
        break;
      case "swap":
        for (let index = yRange[0]; index < yRange[1]; index++) {
          if (graph[xRange[0]][index] !== opDict["empty"]) {
            graph[xRange[0]][index] = opDict["vertical_line"];
          } else {
            graph[xRange[0]][index] = opDict["vertical_line_empty_bg"];
          }
        }
        
        graph[xRange[0]][yRange[0]] = opDict["swap_up"];
        graph[xRange[0]][yRange[1]] = opDict["swap_down"];
        break;
      case "cswap":
        for (let index = yRange[0]; index < yRange[2]; index++) {
          if (graph[xRange[0]][index] !== opDict["empty"]) {
            graph[xRange[0]][index] = opDict["vertical_line"];
          } else {
            graph[xRange[0]][index] = opDict["vertical_line_empty_bg"];
          }
        }
        graph[xRange[0]][yRange[0]] = opDict["ctrl_up"];
        graph[xRange[0]][yRange[1]] = opDict["swap_middle"];
        graph[xRange[0]][yRange[2]] = opDict["swap_down"];
        break;
      case "ccx":
        let ctrl_bit_small = yRange[0];
        let ctrl_bit_big = yRange[1];
        const target = yRange[2];
        if (ctrl_bit_small > ctrl_bit_big) {
          ctrl_bit_small = yRange[1];
          ctrl_bit_big = yRange[0];
        }
        if (target < ctrl_bit_small && target < ctrl_bit_big) {
          graph[xRange[0]][yRange[2]] = opDict["cy_up"];

          for (let index = target + 1; index <= ctrl_bit_big; index++) {
            if (graph[xRange[0]][index] !== opDict["empty"]) {
              graph[xRange[0]][index] = opDict["vertical_line"];
            } else {
              graph[xRange[0]][index] = opDict["vertical_line_empty_bg"];
            }
            // graph[xRange[0]][index] = opDict["vertical_line"];
          }
          graph[xRange[0]][ctrl_bit_small] = opDict["ctrl_middle"];
          graph[xRange[0]][ctrl_bit_big] = opDict["ctrl_down"];
        } else {
          graph[xRange[0]][yRange[2]] = opDict["cy_down"];
          for (let index = ctrl_bit_small; index < target; index++) {
            if (graph[xRange[0]][index] !== opDict["empty"]) {
              graph[xRange[0]][index] = opDict["vertical_line"];
            } else {
              graph[xRange[0]][index] = opDict["vertical_line_empty_bg"];
            }
            // graph[xRange[0]][index] = opDict["vertical_line"];
          }

          graph[xRange[0]][ctrl_bit_small] = opDict["ctrl_up"];
          graph[xRange[0]][ctrl_bit_big] = opDict["ctrl_middle"];
        }

        graphText.push({ x: xRange, y: [target], content: op });
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
                if (graph[xRange[0]][index] == opDict["empty"]) {
                  graph[xRange[0]][index] =
                    opDict["single_gate_middle_empty_bg"];
                } else {
                  graph[xRange[0]][index] = opDict["single_gate_middle"];
                }
              }
              if (graph[xRange[0]][start] == opDict["empty"]) {
                graph[xRange[0]][start] = opDict["single_gate_up_empty_bg"];
              } else {
                graph[xRange[0]][start] = opDict["single_gate_up"];
              }

              if (
                graph[xRange[0]][yRange[yRange.length - 1]] == opDict["empty"]
              ) {
                graph[xRange[0]][yRange[yRange.length - 1]] =
                  opDict["single_gate_bottom_empty_bg"];
              } else {
                graph[xRange[0]][yRange[yRange.length - 1]] =
                  opDict["single_gate_bottom"];
              }

              if (op[1] == "c") {
                graph[xRange[0]][start] = opDict["custom_ctrl_up"];
                if (graph[xRange[0]][start + 1] == opDict["empty"]) {
                  graph[xRange[0]][start + 1] =
                    opDict["single_gate_up_empty_bg"];
                } else {
                  graph[xRange[0]][start + 1] = opDict["single_gate_up"];
                }
              } else if (op == "_CAdder") {
                graph[xRange[0]][end] = opDict["custom_ctrl_bottom"];
                graph[xRange[0]][secondEnd] =
                  graph[xRange[0]][secondEnd] == opDict["empty"]
                    ? opDict["single_gate_ctrl_bottom_empty_bg"]
                    : opDict["single_gate_ctrl_bottom"];
                for (let index = secondEnd + 1; index < end; index++) {
                  graph[xRange[0]][index] =
                    graph[xRange[0]][index] == opDict["empty"]
                      ? opDict["custom_vertical_line_empty_bg"]
                      : opDict["custom_vertical_line"];
                }
              }
              break;
          }
          if (op[1] == "c") {
            graphText.push({
              x: xRange,
              y: [yRange[1], yRange[yRange.length - 1]],
              content: op,
            });
          } else if (op == "_CAdder") {
            graphText.push({
              x: xRange,
              y: [yRange[0], yRange[yRange.length - 2]],
              content: op,
            });
          } else {
            graphText.push({
              x: xRange,
              y: [yRange[0], yRange[yRange.length - 1]],
              content: op,
            });
          }
        }
        break;
    }
    if (gateRole == 1) {
      for (let row = start; row < end; row++) {
        for (let col = xRange[xRange.length - 1] + 1; col < cols; col++) {
          graph[col][row] = opDict["empty"];
        }
      }
      if (op == "cx" || op == "cy" || op == "cz" || op == "cp") {
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
