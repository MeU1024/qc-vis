import { useState, useEffect } from "react";
import BitsName from "../../components/BitsName";
import { CircuitAnnotator } from "../../components/CircuitAnnotator";
import { CircuitRender } from "../../components/CircuitRender";
import flowData from "../../../data/vqc-context_test.json";
import Circuit2GridData from "../../utilities/Circuit2GridData";
export interface DataFlowPanelProps {
  theme: any;
  highlightGate: string | null;
}
const DataFlowPanel = (props: DataFlowPanelProps) => {
  const { theme, highlightGate } = props;
  const [gridWidth, setGridWidth] = useState<number>(50);
  const [gridHeight, setGridHeight] = useState<number>(50);
  const [canvasWidth, setCanvasWidth] = useState(550);
  const [canvasHeight, setCanvasHeight] = useState(250);
  const [qbitLengths, setQbitLength] = useState<string[]>([]);
  const [panelTitle, setPanelTitle] = useState("Context");

  const [circuit, setCircuit] = useState<{
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: (number | number[])[][];
  }>(flowData);

  useEffect(() => {
    var gridSize =
      canvasWidth / circuit.output_size[1] <
      canvasHeight / circuit.output_size[0]
        ? canvasWidth / circuit.output_size[1]
        : canvasHeight / circuit.output_size[0];
    gridSize = gridSize < 25 ? 25 : gridSize;

    setGridWidth(gridSize);
    setGridHeight(gridSize);
    if (gridSize * circuit.output_size[0] < canvasWidth) {
      setGridHeight(canvasHeight / circuit.output_size[0]);
    }
    setQbitLength(circuit.qubits);
  }, [circuit]);

  useEffect(() => {
    if (gridHeight !== null && gridWidth !== null) {
      const { graph, graphText } = Circuit2GridData(circuit);

      const canvas = document.getElementById("dataflowCanvas");
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
  }, [circuit, gridWidth, theme]);

  
  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;
      console.log(message);
      switch (message.command) {
        case "context.setCircuit":
          setCircuit(message.data);
          console.log(message.data);
          break;
        case "context.setCanvasSize":
          setCanvasWidth(message.data.width);
          setCanvasHeight(message.data.height);
          break;
        case "context.setTitle":
          setPanelTitle(message.data.title);
          break;
      }
    };
    window.addEventListener("message", handleMessageEvent);
    return () => {
      window.removeEventListener("message", handleMessageEvent);
    };
  }, []);

  return (
    <div className="panel">
      <div className="panelHeader">{panelTitle}</div>
      <div
        className="circuit"
        style={{
          gridTemplateColumns:
            ((gridHeight < 50 ? gridHeight : 50) * 0.6).toString() + "px auto",
        }}
      >
        {" "}
        <BitsName
          qbitLengths={qbitLengths}
          alignment={"super"}
          gridHeight={gridHeight}
        />
        <canvas id="dataflowCanvas" width="550" height="250"></canvas>
      </div>
    </div>
  );
};

export interface generateGraphDataProp {
  row: Number;
  col: Number;
}

const generateGraphData = (props: generateGraphDataProp) => {
  var graph = [];
  for (let col = 0; col < props.col; col++) {
    var layer = [];
    for (let row = 0; row < props.col; row++) {
      if (row == 2 || row == 3) {
        layer.push(0);
      } else {
        layer.push(5);
      }
    }
    graph.push(layer);
  }

  return graph;
};
export default DataFlowPanel;
