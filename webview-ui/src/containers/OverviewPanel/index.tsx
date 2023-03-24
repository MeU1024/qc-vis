import { useEffect, useState } from "react";
import BitsName from "../../components/BitsName";
import { CircuitAnnotator } from "../../components/CircuitAnnotator";
import { CircuitRender } from "../../components/CircuitRender";
import "./index.scss";
import overviewData from "../../../data/vqc-10-overview.json";
import overviewData_abs from "../../../data/vqc-10-detail-abstract.json";
import Circuit2GridData from "../../utilities/Circuit2GridData";

export interface OverviewPanelProps {
  // gridWidth: number;
  // gridHeight: number;
  theme: any;
  highlightGate: string | null;
}
const OverviewPanel = (props: OverviewPanelProps) => {
  const { theme, highlightGate } = props;

  const [gridWidth, setGridWidth] = useState<number>(25);
  const [gridHeight, setGridHeight] = useState<number>(25);
  const [canvasWidth, setCanvasWidth] = useState(1500);
  const [canvasHeight, setCanvasHeight] = useState(400);
  const [qbitLengths, setQbitLength] = useState<string[]>([]);

  const [circuit, setCircuit] = useState<{
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: (number | number[])[][];
    originalQubitLength?: number;
    originalGateLength?: number;
  }>(overviewData_abs);

  useEffect(() => {
    // var gridSize =
    //   canvasWidth / circuit.output_size[1] <
    //   canvasHeight / circuit.output_size[0]
    //     ? canvasWidth / circuit.output_size[1]
    //     : canvasHeight / circuit.output_size[0];
    var gridSize = canvasHeight / circuit.output_size[0];
    gridSize = gridSize < 20 ? 20 : gridSize;
    gridSize = gridSize > 200 ? 200 : gridSize;

    setGridWidth(gridSize);
    setGridHeight(gridSize);
    setCanvasHeight(gridSize * circuit.output_size[0]);
    setCanvasWidth(
      gridSize * circuit.output_size[1] < 32000
        ? gridSize * circuit.output_size[1]
        : 32000
    );
    // if (gridSize * circuit.output_size[0] < canvasWidth) {
    //   setGridHeight(canvasHeight / circuit.output_size[0]);
    // }
    setQbitLength(circuit.qubits);
  }, [circuit]);

  useEffect(() => {
    if (gridHeight !== null && gridWidth !== null) {
      const { graph, graphText } = Circuit2GridData(circuit);
      const canvas = document.getElementById("overviewCanvas");

      if (canvas) {
        const ctx = (canvas as HTMLCanvasElement).getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.clearRect(
            0,
            0,
            (canvas as HTMLCanvasElement).width,
            (canvas as HTMLCanvasElement).height
          );
          CircuitRender({ graph, ctx, gridWidth, gridHeight });
          CircuitAnnotator({ graphText, ctx, gridWidth, gridHeight });
        }
      }
    }
  }, [circuit, canvasHeight, canvasWidth, gridHeight, gridWidth]);

  useEffect(() => {
    if (highlightGate == "PA") {
      setCircuit(generateData());
    } else {
      setCircuit(generateData());
    }
  }, [highlightGate]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;
      switch (message.command) {
        case "component.setCircuit":
          setCircuit(message.data);
          console.log("in diagram", message.data);
          break;
        case "component.setCanvasSize":
          setCanvasWidth(message.data.width);
          setCanvasHeight(message.data.height);
          break;
      }
    };
    window.addEventListener("message", handleMessageEvent);
    return () => {
      window.removeEventListener("message", handleMessageEvent);
    };
  }, []);

  return (
    <div className="panel" id="overviewPanel">
      <div className="panelHeader">
        <span
          className="title"
          onClick={() => {
            setCircuit(circuit == overviewData ? generateData() : overviewData);
          }}
        >
          Quantum Circuit Diagram
        </span>
        <div className="info-group">
          <span className="info">#Qubits: {circuit.originalQubitLength}</span>
          <span className="info">#Gates: {circuit.originalQubitLength}</span>
          <span className="info">#Layer: {circuit.output_size[1]}</span>
        </div>
      </div>
      <div
        className="circuit"
        style={{
          gridTemplateColumns:
            ((gridHeight < 50 ? gridHeight : 50) * 1.2).toString() + "px auto",
        }}
      >
        <BitsName
          qbitLengths={qbitLengths}
          alignment={"sub"}
          gridHeight={gridHeight}
        />
        <canvas
          id="overviewCanvas"
          width={canvasWidth}
          height={canvasHeight}
        ></canvas>
      </div>
      <div className="divider"></div>
    </div>
  );
};

export default OverviewPanel;

const generateData = () => {
  var data = {
    output_size: [10, 30],
    op_map: { _h: 0, _PA: 1, _Ent: 2, rz: 3, cx: 4 },
    qubits: ["1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
    gate_format: "[op_idx, num_qubits, x_range, y_range]",
    all_gates: [[0, [0], [0, 9]]],
  };
  for (let index = 0; index < 10; index++) {
    data.all_gates.push([3, [1], [index]]);
  }
  for (let index = 0; index < 9; index++) {
    data.all_gates.push([4, [2 + index * 3], [index, index + 1]]);
    data.all_gates.push([3, [3 + index * 3], [index + 1]]);
    data.all_gates.push([4, [4 + index * 3], [index, index + 1]]);
  }
  data.all_gates.push([2, [29], [0, 9]]);

  return data;
};
