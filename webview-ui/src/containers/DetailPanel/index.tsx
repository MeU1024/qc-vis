import { useCallback, useEffect, useRef, useState } from "react";
import BitsName from "../../components/BitsName";
import { CircuitAnnotator } from "../../components/CircuitAnnotator";
import { CircuitRender } from "../../components/CircuitRender";
import Circuit2GridData from "../../utilities/Circuit2GridData";

import data from "../../../data/vqc-10-detail-abstract.json";
import { BOLD_LINE_WIDTH, LINE_WIDTH, WIRE_STROKE } from "../../const";
export interface DetailPanelProps {
  theme: any;
  highlightGate: string | null;
}

const DetailPanel = (props: DetailPanelProps) => {
  const [qbitLengths, setQbitLength] = useState<string[]>([]);
  const [gridWidth, setGridWidth] = useState<number>(25);
  const [gridHeight, setGridHeight] = useState<number>(25);
  const [canvasWidth, setCanvasWidth] = useState(650);
  const [canvasHeight, setCanvasHeight] = useState(350);
  const [circuit, setCircuit] = useState<{
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: (number | number[])[][];
  }>(data);

  const [scale, setScale] = useState(1);
  const [widthScale, setWidthScale] = useState(1);
  const [originalGridWidth, setOriginalGridWidth] = useState(25);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canvasStyle = {
    transform: `scale(${scale})`,
    transformOrigin: "0 0",
  };

  const [panelTitle, setPanelTitle] = useState("Abstraction");

  const canvasFixedWidth = 32000;

  const { theme, highlightGate } = props;

  useEffect(() => {
    setGridWidth(originalGridWidth * widthScale);
  }, [widthScale]);

  useEffect(() => {
    const canvas = canvasRef.current;

    const handleWheelEvent = (e: any) => {
      if (e.ctrlKey) {
        e.preventDefault();
        let deltaScale = e.deltaY * -0.001;
        // console.log(widthScale);
        if (deltaScale > 0) {
          if (widthScale < 1) {
            setWidthScale((widthScale) =>
              Math.min(Math.max(widthScale + deltaScale * 0.1, 0.35), 1)
            );
          } else {
            setScale((scale) =>
              Math.min(Math.max(scale + deltaScale, 0.1), 10)
            );
          }
        } else {
          const scaleChange = Math.min(Math.max(scale + deltaScale, 0.1), 10);
          // console.log("scaleChange", scaleChange);
          if (scaleChange * canvasHeight < 350) {
            setWidthScale((widthScale) =>
              Math.min(Math.max(widthScale + deltaScale * 0.1, 0.35), 1)
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

  //fetch data and modify canvas size
  useEffect(() => {
    var gridSize = canvasHeight / circuit.output_size[0];
    gridSize = gridSize < 25 ? 25 : gridSize;

    setGridWidth(gridSize);
    setGridHeight(gridSize);
    setCanvasWidth(gridSize * circuit.output_size[1]);
    setCanvasHeight(gridSize * circuit.output_size[0]);
    setOriginalGridWidth(gridSize);
    // if (gridSize * circuit.output_size[0] < canvasWidth) {
    //   setGridHeight(canvasHeight / circuit.output_size[0]);
    // }
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

          //add wires
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
  }, [gridWidth, theme, circuit, canvasHeight, canvasWidth]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;
      switch (message.command) {
        case "abstraction.setCircuit":
          setCircuit(message.data);
          console.log("abs", message.data);
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
    <div className="panel abstraction-view">
      <div className="panelHeader">
        <span className="title">{panelTitle}</span>
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
          id="detailCanvas"
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

export default DetailPanel;
