import { useEffect, useState } from "react";
import BitsName from "../../components/BitsName";
import { CircuitAnnotator } from "../../components/CircuitAnnotator";
import { CircuitRender } from "../../components/CircuitRender";
import GridDrawing from "../../components/GridDrawing";
import GridText from "../../components/GridText";
import "./index.scss";

const OverviewPanel = () => {
  const [highlightGate, setHighlightGate] = useState<string | null>(null);
  const gridWidth = 50;
  const gridHeight = 50;

  const handleMessage = (event: MessageEvent<any>) => {
    const message = event.data; // The JSON data our extension sent

    switch (message.command) {
      case "update":
        setHighlightGate(message.text);
        break;
    }
  };

  useEffect(() => {
    //fetch data
    const graph = generateGraphData({ row: 5, col: 11 });
    const graphText = [
      { x: [0], y: [0], content: "H" },
      { x: [1], y: [0, 1, 2], content: "G1" },
      { x: [2], y: [1, 2, 3], content: "G2" },
      { x: [3], y: [0, 1], content: "G3" },
      { x: [8], y: [0, 1, 2], content: "G5" },
    ];
    const canvas = document.getElementById("overviewCanvas");
    if (canvas) {
      const ctx = (canvas as HTMLCanvasElement).getContext("2d");
      if (ctx) {
        CircuitRender({ graph, ctx, gridWidth, gridHeight });
        CircuitAnnotator({ graphText, ctx, gridWidth, gridHeight });
      }
    }
  }, [highlightGate]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  //

  return (
    <div className="panel">
      <div className="panelHeader"> Overview {highlightGate}</div>

      <div className="circuit">
        <BitsName
          qbitLengths={["1", "5", "10", "5", "1"]}
          alignment={"super"}
        />
        <canvas id="overviewCanvas" width="550" height="250"></canvas>
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
      layer.push("line");
    }
    graph.push(layer);
  }
  graph[0][0] = "single";

  graph[1][0] = "up";
  graph[1][1] = "middle";
  graph[1][2] = "bottom";

  graph[2][1] = "up";
  graph[2][2] = "middle";
  graph[2][3] = "bottom";

  graph[3][0] = "up";
  graph[3][1] = "bottom";

  graph[8][0] = "up";
  graph[8][1] = "middle";
  graph[8][2] = "bottom";

  return graph;
};
export default OverviewPanel;
