import { useEffect, useState } from "react";
import BitsName from "../../components/BitsName";
import GridDrawing from "../../components/GridDrawing";
import "./index.scss";

const OverviewPanel = () => {
  const [highlightGate, setHighlightGate] = useState("");
  //const gridData = [{x:0,y:0,op:"line"}]
  useEffect(() => {
    overviewCircuit();
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

  const overviewCircuit = () => {
    for (let col = 0; col < 10; col++) {
      for (let row = 0; row < 5; row++) {
        GridDrawing({
          x: col * 50,
          y: row * 50,
          width: 50,
          height: 50,
          op: "line",
        });
      }
    }
    // for (let row = 0; row < 5; row++) {

    // }
    GridDrawing({
      x: 10 * 50,
      y: 1 * 50,
      width: 50,
      height: 50,
      op: "up",
    });
    GridDrawing({
      x: 10 * 50,
      y: 2 * 50,
      width: 50,
      height: 50,
      op: "middle",
    });
    GridDrawing({
      x: 10 * 50,
      y: 3 * 50,
      width: 50,
      height: 50,
      op: "bottom",
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

export default OverviewPanel;
