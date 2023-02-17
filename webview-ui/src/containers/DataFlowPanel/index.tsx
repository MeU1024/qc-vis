import { useState, useEffect } from "react";
import BitsName from "../../components/BitsName";
import { CircuitAnnotator } from "../../components/CircuitAnnotator";
import { CircuitRender } from "../../components/CircuitRender";

const DataFlowPanel = () => {
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

    const canvas = document.getElementById("dataflowCanvas");
    if (canvas) {
      const ctx = (canvas as HTMLCanvasElement).getContext("2d");
      if (ctx) {
        CircuitRender({ graph, ctx, gridWidth, gridHeight });
        // CircuitAnnotator({ graphText, ctx, gridWidth, gridHeight });
      }
    }
  }, [highlightGate]);

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className="panel">
      <div className="panelHeader"> DataFlow</div>
      <div className="circuit">
        {" "}
        <BitsName qbitLengths={["", "", "5", "10", ""]} alignment={"super"} />
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
        layer.push("line");
      } else {
        layer.push("empty");
      }
    }
    graph.push(layer);
  }

  return graph;
};
export default DataFlowPanel;
