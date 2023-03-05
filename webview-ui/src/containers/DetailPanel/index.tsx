import { useEffect, useState } from "react";
import BitsName from "../../components/BitsName";
import { CircuitAnnotator } from "../../components/CircuitAnnotator";
import { CircuitRender } from "../../components/CircuitRender";
import Circuit2GridData from "../../utilities/Circuit2GridData";

import data from "../../../data/vqc-10-detail-abstract.json";
export interface DetailPanelProps {
  theme: any;
  highlightGate: string | null;
}

const DetailPanel = (props: DetailPanelProps) => {
  const [qbitLengths, setQbitLength] = useState<string[]>([]);
  const [gridWidth, setGridWidth] = useState<number>(25);
  const [gridHeight, setGridHeight] = useState<number>(25);
  const [canvasWidth, setCanvasWidth] = useState(550);
  const [canvasHeight, setCanvasHeight] = useState(250);
  const [circuit, setCircuit] = useState<{
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: (number | number[])[][];
  }>(data);

  const [panelTitle, setPanelTitle] = useState("Abstraction");

  const { theme, highlightGate } = props;

  //fetch data and modify canvas size
  useEffect(() => {
    var gridSize =
      canvasWidth / circuit.output_size[1] <
      canvasHeight / circuit.output_size[0]
        ? canvasWidth / circuit.output_size[1]
        : canvasHeight / circuit.output_size[0];

    gridSize = gridSize < 25 ? 25 : gridSize;

    setGridWidth(gridSize);
    setGridHeight(gridSize);
    setQbitLength(circuit.qubits);
  }, [circuit]);

  useEffect(() => {
    if (gridHeight !== null && gridWidth !== null) {
      const { graph, graphText } = Circuit2GridData(circuit);

      const canvas = document.getElementById("detailCanvas");
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
  }, [gridWidth, theme, circuit]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;
      console.log(message);
      switch (message.command) {
        case "abstraction.setCircuit":
          setCircuit(message.data);
          console.log(message.data);
          break;
        case "abstraction.setCanvasSize":
          setCanvasWidth(message.data.width);
          setCanvasHeight(message.data.height);
          break;
        case "abstraction.setTitle":
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
          gridTemplateColumns: (gridHeight * 0.6).toString() + "px auto",
        }}
      >
        <BitsName
          qbitLengths={qbitLengths}
          alignment={"sub"}
          gridHeight={gridHeight}
        />
        <canvas id="detailCanvas" width="550" height="250"></canvas>
      </div>
    </div>
  );
};

export default DetailPanel;
