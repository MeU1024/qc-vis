import { useState, useEffect } from "react";
import "./index.scss";
import * as d3 from "d3";
import { PARA_HIGH_FILL, PARA_LOW_FILL } from "../../const";
import overviewData_abs from "../../../data/vqc-10-detail-abstract.json";
import Circuit2GridData from "../../utilities/Circuit2GridData";
import { svgCircuitRender } from "../../utilities/svgCircuitRender";
export interface ParallelismPanelProps {
  theme: any;
  highlightGate: string | null;
}
const geneParaData = () => {
  return [0.1, 0, 3, 0.8, 0.5, 1, 0];
};
const ParallelismPanel = (props: ParallelismPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Idle Qubit | Parallelism");
  const [idleBarwidth, setIdleBarwidth] = useState(30);
  const [idleBarheight, setIdleBarheight] = useState(350);
  const [canvasWidth, setCanvasWidth] = useState(350);
  const [canvasHeight, setCanvasHeight] = useState(350);
  const [focusLayer, setFocusLayer] = useState(0);
  const [paraData, setParaData] = useState(geneParaData());
  const [circuit, setCircuit] = useState<
    | {
        output_size: number[];
        op_map: {};
        qubits: string[];
        gate_format: string;
        all_gates: ((number | number[])[] | (number | number[])[])[];
      }
    | undefined
  >(generateCircuit());

  const paraBarwidth = 350;
  const paraBarheight = 5;

  const colorScale = d3
    .scaleLinear<string>()
    .domain([0, 1])
    .range([PARA_LOW_FILL, PARA_HIGH_FILL]);

  useEffect(() => {
    if (circuit !== undefined) {
      svgCircuitRender({
        id: "#parallelismSVG",
        width: canvasWidth,
        height: canvasHeight,
        gridSize: 50,
        circuit: circuit,
      });
    }
  }, [circuit]);
  useEffect(() => {
    var svg = d3.select("#parallelismBar");
    svg.selectAll("*").remove();
    const rectNumber = paraData.length;
    const rectWidth = paraBarwidth / rectNumber;
    var gradient = svg
      .append("defs")
      .append("linearGradient")
      .attr("id", "myGradient");
    // .attr("x1", "0%")
    // .attr("y1", "0%")
    // .attr("x2", "100%")
    // .attr("y2", "0%");
    for (let index = 0; index < rectNumber; index++) {
      gradient
        .append("stop")
        .attr("offset", (index / rectNumber).toString())
        .attr("stop-color", colorScale(paraData[index]));
    }

    svg
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", paraBarwidth)
      .attr("height", paraBarheight)
      // .attr("margin", "-1px")
      .style("stroke-width", 0)
      // .style("fill", colorScale(0));
      .style("fill", "url(#myGradient)");
  }, [paraData]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          setParaData(message.data.layerParallelism);
          setCircuit(message.data.subGraph);
          console.log(message);
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
    <div className="parallelismPanel">
      <div className="panelHeader">{panelTitle}</div>
      <div>Idle Wire Extent:</div>
      <div>Parallelism Level:</div>
      <div>Idle Level:</div>
      <div className="parallelismView">
        <div className="firstRow">
          {" "}
          <svg
            id="parallelismSVG"
            viewBox={"0 0 " + canvasWidth + " " + canvasHeight}
            width={canvasWidth}
            height={canvasHeight}
          ></svg>
          <svg
            id="idleBar"
            viewBox={"0 0 " + idleBarwidth + " " + idleBarheight}
            width={idleBarwidth}
            height={idleBarheight}
          ></svg>
        </div>
        <svg
          id="parallelismBar"
          viewBox={"0 0 " + paraBarwidth + " " + paraBarheight}
          width={paraBarwidth}
          height={paraBarheight}
        ></svg>
      </div>
    </div>
  );
};

const generateCircuit = () => {
  return {
    output_size: [7, 7],
    op_map: { null: 0, h: 1, cx: 2, cz: 3, ry: 4, rz: 5 },
    qubits: ["0", "1", "2", "3", "4", "5", "6"],
    gate_format: "[op_idx, x_range, y_range]",
    all_gates: [
      [1, [0], [0]],
      [1, [0], [1]],
      [1, [0], [2]],
      [1, [0], [3]],
      [1, [0], [4]],
      [1, [0], [5]],
      [1, [0], [6]],

      [5, [1], [0]],
      [5, [1], [1]],
      [5, [1], [2]],
      [5, [1], [3]],
      [5, [1], [4]],
      [5, [1], [5]],
      [5, [1], [6]],

      [2, [2], [0, 1]],
      [5, [3], [1]],
      [2, [4], [0, 1]],
      [2, [5], [1, 2]],
      [4, [5], [0]],
      [5, [6], [2]],
      [5, [6], [0]],
    ],
  };
};
export default ParallelismPanel;
