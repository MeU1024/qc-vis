import { useEffect, useState } from "react";
import BitsName from "../../components/BitsName";
import { CircuitAnnotator } from "../../components/CircuitAnnotator";
import { CircuitRender } from "../../components/CircuitRender";

const DetailPanel = () => {
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
    var graph = [];
    for (let col = 0; col < 11; col++) {
      var layer = [];
      for (let row = 0; row < 5; row++) {
        layer.push("line");
      }
      graph.push(layer);
    }

    const graphText = [
      { x: [0], y: [0], content: "H" },
      { x: [1], y: [0, 1, 2], content: "G1" },
      { x: [2], y: [1, 2, 3], content: "G2" },
      { x: [3], y: [0, 1], content: "G3" },
      { x: [8], y: [0, 1, 2], content: "G5" },
    ];
    const canvas = document.getElementById("detailCanvas");
    if (canvas) {
      const ctx = (canvas as HTMLCanvasElement).getContext("2d");
      if (ctx) {
        CircuitRender({ graph, ctx, gridWidth, gridHeight });
        //CircuitAnnotator({ graphText, ctx, gridWidth, gridHeight });
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
      <div className="panelHeader"> Detail</div>
      <div className="circuit">
        <BitsName
          qbitLengths={["1", "2", "···", "n-1", "n"]}
          alignment={"sub"}
        />
        <canvas id="detailCanvas" width="550" height="250"></canvas>
      </div>
    </div>
  );
};

export default DetailPanel;
