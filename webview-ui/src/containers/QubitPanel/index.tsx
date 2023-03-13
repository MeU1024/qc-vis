import { useState, useEffect } from "react";
import "./index.scss";
import * as d3 from "d3";
import GridDrawing from "../../components/GridDrawing";
import {
  CUSTOM_GATE_STROKE,
  GATE_FILL,
  GATE_FILL_OPACITY,
  MULTI_GATE_STROKE,
  SINGLE_GATE_STROKE,
  WIRE_STROKE,
} from "../../const";

export interface QubitPanelProps {
  theme: any;
  highlightGate: string | null;
}
const generateQubitData = () => {
  return [
    { gateName: "_HA", qubits: ["0"] },
    { gateName: "rz", qubits: ["0"] },
    { gateName: "rz", qubits: ["0"] },
    { gateName: "cx", qubits: ["0", "1"] },
    { gateName: "cx", qubits: ["1", "0"] },
    { gateName: "_Ent", qubits: ["0"] },
  ];
};

const QubitPanel = (props: QubitPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("QubitPanel");
  const [qubitData, setQubitData] = useState<
    | undefined
    | {
        gateName: string;
        qubits: string[];
      }[]
  >(undefined);

  const [focusQubit, setFocusQubit] = useState(0);
  const opTypeDict: { [key: string]: string } = {
    rx: "single",
    ry: "single",
    rz: "single",
    h: "single",
    cx: "multi",
    cy: "multi",
    cz: "multi",
  };
  const colorDict: { [key: string]: string } = {
    single: SINGLE_GATE_STROKE,
    customized: CUSTOM_GATE_STROKE,
    target: MULTI_GATE_STROKE,
    control: MULTI_GATE_STROKE,
  };

  const width = 650;
  const height = 80;
  const gridSize = height / 2;
  useEffect(() => {
    if (qubitData !== undefined) {
      var svg = d3.select("#qubitSVG");
      svg.selectAll("*").remove();
      // Get a reference to the SVG container

      var shapes = svg.selectAll("g").data(qubitData).enter().append("g");

      shapes.each(function (d, i) {
        var shape;
        // //gird
        // shape = d3.select(this).append("rect");
        // shape
        //   .attr("x", i * gridSize)
        //   .attr("y", gridSize / 2)
        //   .attr("width", gridSize)
        //   .attr("height", gridSize)

        //   .attr("stroke", SINGLE_GATE_STROKE)
        //   .attr("fill", GATE_FILL)
        //   .attr("fill-opacity", GATE_FILL_OPACITY);

        let gateName = d.gateName;
        //TODO:3bit
        let diff = parseInt(d.qubits[0]) - parseInt(d.qubits[1]) > 0 ? -1 : 1;
        let entQubit = "";
        //draw wire
        shape = d3.select(this).append("line");
        shape
          .attr("x1", i * gridSize)
          .attr("y1", gridSize)
          .attr("x2", (i + 1) * gridSize)
          .attr("y2", gridSize)
          .attr("stroke", WIRE_STROKE);

        //type
        let gateType = "empty";
        if (d.gateName[0] == "_") {
          gateType = "customized";
          gateName = gateName.slice(1);
        } else if (opTypeDict[d.gateName] == "multi") {
          gateType =
            d.qubits[0] == focusQubit.toString() ? "control" : "target";
          entQubit =
            d.qubits[0] == focusQubit.toString() ? d.qubits[1] : d.qubits[0];
        } else {
          gateType = opTypeDict[d.gateName];
        }

        //gate drawing
        if (
          gateType === "single" ||
          gateType === "customized" ||
          gateType === "target"
        ) {
          shape = d3.select(this).append("rect");
          shape
            .attr("x", i * gridSize + gridSize / 4)
            .attr("y", (gridSize / 4) * 3)
            .attr("width", gridSize / 2)
            .attr("height", gridSize / 2)
            .attr("rx", gridSize / 20)
            .attr("stroke", colorDict[gateType])
            .attr("fill", GATE_FILL)
            .attr("fill-opacity", GATE_FILL_OPACITY);

          shape = d3.select(this).append("text");
          shape
            .style("font-size", (height / 6).toString() + "px")
            .attr("x", i * gridSize + gridSize / 2)
            .attr("y", gridSize + parseInt(shape.style("font-size")) / 4)
            .text(gateName)
            .attr("text-anchor", "middle")
            .style("fill", colorDict[gateType]);
        }
        if (gateType === "control" || gateType === "target") {
          shape = d3.select(this).append("text");
          shape
            .style("font-size", (height / 8).toString() + "px")
            .attr("x", i * gridSize + gridSize / 2)
            .attr(
              "y",
              (gridSize / 2) * 3 + (parseInt(shape.style("font-size")) * 4) / 3
            )
            .text("Qubit " + entQubit)
            .attr("text-anchor", "middle")
            .style("fill", colorDict[gateType]);
        }
        switch (gateType) {
          case "single":
            break;
          case "customized":
            break;
          case "control":
            shape = d3.select(this).append("circle");
            shape
              .attr("cx", i * gridSize + gridSize / 2)
              .attr("cy", gridSize)
              .attr("r", gridSize / 15)
              .attr("fill", colorDict[gateType]);

            shape = d3.select(this).append("line");
            shape
              .attr("x1", i * gridSize + gridSize / 2)
              .attr("y1", gridSize)
              .attr("x2", i * gridSize + gridSize / 2)
              .attr("y2", gridSize + (diff * gridSize) / 2)
              .attr("stroke", colorDict[gateType]);
            break;
          case "target":
            shape = d3.select(this).append("circle");
            shape
              .attr("cx", i * gridSize + gridSize / 2)
              .attr("cy", gridSize - (diff * gridSize) / 2)
              .attr("r", gridSize / 15)
              .attr("fill", colorDict[gateType]);

            shape = d3.select(this).append("line");
            shape
              .attr("x1", i * gridSize + gridSize / 2)
              .attr("y1", gridSize - (diff * gridSize) / 4)
              .attr("x2", i * gridSize + gridSize / 2)
              .attr("y2", gridSize - (diff * gridSize) / 2)
              .attr("stroke", colorDict[gateType]);
            break;
          default:
            console.log("Unknown shape type:", d.gateName);
            break;
        }
      });
    }
  }, [qubitData]);
  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          setQubitData(message.data.focusQubitGates);
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
    <div className="panel">
      <div className="panelHeader">{panelTitle}</div>
      <div className="qubitView">
        <div className="qubitTitle">Qubit {focusQubit}</div>
        <svg
          id="qubitSVG"
          viewBox={"0 0 " + width + " " + height}
          width={width}
          height={height}
        ></svg>
      </div>
    </div>
  );
};

export default QubitPanel;