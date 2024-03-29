import { useEffect, useRef, useState } from "react";
import BitsName from "../../components/BitsName";
import { CircuitAnnotator } from "../../components/CircuitAnnotator";
import { CircuitRender } from "../../components/CircuitRender";
import "./index.scss";
import overviewData from "../../../data/vqc-10-overview.json";
// import overviewData_abs from "../../../data/vqc-10-detail-abstract.json";
import Circuit2GridData from "../../utilities/Circuit2GridData";
import { WIRE_STROKE, LINE_WIDTH, BOLD_LINE_WIDTH } from "../../const";
import { HighlightFrameRender } from "../../utilities/HighlightFrameRender";
import { HighlightBackgroundRender } from "../../utilities/HighlightBackgroundRender";
import { generateKey } from "crypto";

export interface OverviewPanelProps {
  theme: any;
  // highlightGate: string | null;
}
const OverviewPanel = (props: OverviewPanelProps) => {
  const { theme } = props;

  const [gridWidth, setGridWidth] = useState<number>(25);
  const [gridHeight, setGridHeight] = useState<number>(25);
  const [canvasWidth, setCanvasWidth] = useState(1500);
  const [canvasHeight, setCanvasHeight] = useState(345);
  const [qbitLengths, setQbitLength] = useState<string[]>([]);
  const [originalData, setOriginalData] = useState<{
    qubit: number;
    layer: number;
    gate: number;
  }>({ qubit: 0, layer: 0, gate: 0 });
  const [circuit, setCircuit] = useState<{
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: (number | number[])[][];
    originalQubitLength?: number;
    originalGateLength?: number;
  } | null>(generateData());
  const [highlightRegions, setHighlightRegions] = useState<
    {
      layer: number[];
      qubit: number[];
      name: string;
      weight: number;
    }[]
  >([]);
  const [scale, setScale] = useState(1);
  const [widthScale, setWidthScale] = useState(1);
  const [originalGridWidth, setOriginalGridWidth] = useState(25);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasFixedWidth = 32000;
  const canvasStyle = {
    transform: `scale(${scale})`,
    transformOrigin: "0 0",
  };

  //Set Gird and Canvas Size
  useEffect(() => {
    setGridWidth(originalGridWidth * widthScale);
  }, [widthScale]);

  useEffect(() => {
    if (circuit) {
      var gridSize = canvasHeight / circuit.output_size[0];
      gridSize = gridSize < 25 ? 25 : gridSize;
      gridSize = gridSize > 200 ? 200 : gridSize;

      setGridWidth(gridSize);
      setGridHeight(gridSize);
      setOriginalGridWidth(gridSize);
      setCanvasHeight(gridSize * circuit.output_size[0]);
      setCanvasWidth(
        gridSize * circuit.output_size[1] < 32000
          ? gridSize * circuit.output_size[1]
          : 32000
      );

      setQbitLength(circuit.qubits);
    }
  }, [circuit]);

  //Render circuit on canvas
  useEffect(() => {
    if (gridHeight && gridWidth && circuit) {
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

          //Render Highlighted Regions and Circuit
          HighlightBackgroundRender({
            highlightRegions,
            ctx,
            gridWidth,
            gridHeight,
          });
          CircuitRender({ graph, ctx, gridWidth, gridHeight });
          CircuitAnnotator({ graphText, ctx, gridWidth, gridHeight });
          HighlightFrameRender({
            highlightRegions,
            ctx,
            gridWidth,
            gridHeight,
          });

          //Render Wires on Blank Region
          const circuitWidth = circuit.output_size[1] * gridWidth;
          const qubitNumber = circuit.output_size[0];
          ctx.strokeStyle = WIRE_STROKE;
          ctx.lineWidth = gridWidth < 50 ? LINE_WIDTH : BOLD_LINE_WIDTH;
          for (let index = 0; index < qubitNumber; index++) {
            ctx.beginPath();
            ctx.moveTo(circuitWidth, index * gridHeight + gridHeight / 2);
            ctx.lineTo(
              canvasFixedWidth - 10,
              index * gridHeight + gridHeight / 2
            );
            ctx.stroke();
          }
        }
      }
    }
  }, [
    circuit,
    canvasHeight,
    canvasWidth,
    gridHeight,
    gridWidth,
    highlightRegions,
  ]);

  //Canvas Scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    const handleWheelEvent = (e: any) => {
      if (e.ctrlKey) {
        e.preventDefault();
        let deltaScale = e.deltaY * -0.001;
        if (deltaScale > 0) {
          if (widthScale < 1) {
            setWidthScale((widthScale) =>
              Math.min(Math.max(widthScale + deltaScale * 0.3, 0.35), 1)
            );
          } else {
            setScale((scale) =>
              Math.min(Math.max(scale + deltaScale, 0.1), 10)
            );
          }
        } else {
          const scaleChange = Math.min(Math.max(scale + deltaScale, 0.1), 10);
          if (scaleChange * canvasHeight < 350) {
            setWidthScale((widthScale) =>
              Math.min(Math.max(widthScale + deltaScale * 0.3, 0.35), 1)
            );
          } else {
            setScale((scale) =>
              Math.min(Math.max(scale + deltaScale, 0.1), 10)
            );
          }
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
  }, [widthScale, scale]);

  //Message Passing
  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;
      switch (message.command) {
        case "component.setCircuit":
          setCircuit(message.data);
          setHighlightRegions(message.data.componentRegion);
          //TODO:layer
          setOriginalData({
            qubit: message.data.originalQubitLength,
            layer: 0,
            gate: message.data.originalLayerLength,
          });
          break;
        case "component.setCanvasSize":
          setCanvasWidth(message.data.width);
          setCanvasHeight(message.data.height);
          break;
        case "component.setRegion":
          setHighlightRegions(message.data);

          break;
        case "context.setCircuit":
        // setOriginalLayerLength(message.data.originalCircuitSize[1]);
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
        <span className="title">Quantum Circuit Diagram</span>
        <div className="info-group">
          <span className="info">#Qubits: {originalData.qubit}</span>
          <span className="info">#Gates: {originalData.gate}</span>
          <span className="info">#Layer: {originalData.layer}</span>
        </div>
      </div>
      <div
        className="circuit"
        style={{
          gridTemplateColumns:
            ((gridHeight < 50 ? gridHeight : 50) * 0.9 * scale).toString() +
            "px auto",
        }}
      >
        <BitsName
          qbitLengths={qbitLengths}
          alignment={"sub"}
          gridHeight={gridHeight * scale}
        />
        <canvas
          id="overviewCanvas"
          width={canvasFixedWidth}
          height={canvasHeight}
          ref={canvasRef}
          style={canvasStyle}
        ></canvas>
      </div>
      <div className="divider"></div>
    </div>
  );
};

export default OverviewPanel;
//TODO: for testing
const generateData = () => {
  var data = {
    output_size: [10, 31],
    op_map: { _h: 0, _PA: 1, _Ent: 2, rz: 3, cx: 4, csw: 5, ryy: 6 },
    qubits: ["1", "1", "1", "1", "1", "1", "1", "1", "1", "1"],
    gate_format: "[op_idx, num_qubits, x_range, y_range]",
    all_gates: [[0, [0], [0, 9]]],
  };
  data.all_gates.push([6, [1], [1, 2]]);
  for (let index = 4; index < 10; index++) {
    data.all_gates.push([3, [1], [index]]);
  }
  for (let index = 0; index < 9; index++) {
    data.all_gates.push([4, [2 + index * 3], [index, index + 1]]);
    data.all_gates.push([3, [3 + index * 3], [index + 1]]);
    data.all_gates.push([4, [4 + index * 3], [index, index + 1]]);
  }
  data.all_gates.push([2, [29], [0, 9]]);
  data.all_gates.push([5, [30], [0, 1, 3]]);

  return data;
};

const demoRegion = [
  {
    layer: [0, 5],
    qubit: [1, 2],
    name: "testing",
    weight: 0.5,
  },
];
