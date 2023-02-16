import { useEffect, useState } from "react";
import BitsName from "../../components/BitsName";
import GridDrawing from "../../components/GridDrawing";
import GridText from "../../components/GridText";
import "./index.scss";

const OverviewPanel = () => {
  const [highlightGate, setHighlightGate] = useState("");
  //const gridData = [{x:0,y:0,op:"line"}]
  useEffect(() => {
    overviewCircuitRender();
  }, []);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      const message = event.data; // The JSON data our extension sent
      console.log("myMessage", message);
      switch (message.command) {
        case "update":
          setHighlightGate(message.text);
          break;
        case "test":
          //setHighlightGate(message.text);
          console.log(message.text);
          break;
      }
    });
  }, []);

  const overviewCircuitRender = () => {
    //fetch graph
    const graph = generateData({ row: 5, col: 11 });

    for (let col = 0; col < 11; col++) {
      for (let row = 0; row < 5; row++) {
        GridDrawing({
          x: col * 50,
          y: row * 50,
          width: 50,
          height: 50,
          op: graph[col][row],
        });
      }
    }

    //annotator
    GridText({
      x: 25,
      y: 25,
      content: "H",
    });
  };
  return (
    <div className="panel">
      <div className="panelHeader"> Overview {highlightGate}</div>
      {/* <canvas id="overviewCanvas"></canvas> */}
      <div className="circuit">
        <BitsName qbitLengths={[1, 5, 10, 5, 1]} />
        <canvas id="overviewCanvas" width="550" height="250"></canvas>
      </div>
    </div>
  );
};

export interface generateDataProp {
  row: Number;
  col: Number;
}

const generateData = (props: generateDataProp) => {
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
