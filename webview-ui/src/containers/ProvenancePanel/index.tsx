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
  opTypeDict,
  colorDict,
} from "../../const";
import { sort } from "d3";

export interface ProvenancePanelProps {
  theme: any;
  highlightGate: string | null;
}
const generateQubitData = () => {
  return [
    { gateName: "_HA", qubits: ["0"], layer: 0 },
    { gateName: "rz", qubits: ["0"], layer: 1 },
    { gateName: "rz", qubits: ["0"], layer: 2 },
    { gateName: "cx", qubits: ["0", "1"], layer: 3 },
    { gateName: "cx", qubits: ["1", "0"], layer: 6 },
    { gateName: "_Ent", qubits: ["0"], layer: 7 },
  ];
};

const ProvenancePanel = (props: ProvenancePanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Provenance");
  const [qubitData, setQubitData] = useState<
    | undefined
    | {
      gateName: string;
      qubits: string[];
      layer: number;
    }[]
  >(generateQubitData());
  const [qubitPos, setQubitPos] = useState<
    {
      gateName: string;
      qubits: string[];
      x: number;
    }[]
  >([]);

  const [focusQubit, setFocusQubit] = useState(0);

  const width = 650;
  const height = 80;
  const gridSize = height / 2;

  useEffect(() => {
    if (qubitData !== undefined) {
      var svg = d3.select("#qubitSVG");
      svg.selectAll("*").remove();
      // Get a reference to the SVG container

      let wire = svg.append("line");
      wire
        .attr("x1", 0)
        .attr("y1", gridSize)
        .attr("x2", width - 10)
        .attr("y2", gridSize)
        .attr("stroke", WIRE_STROKE);

      var shapes = svg.selectAll("g").data(qubitPos).enter().append("g");

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
        let xPos = d.x;
        let gateName = d.gateName;
        //TODO:3bit
        let diff = parseInt(d.qubits[0]) - parseInt(d.qubits[1]) > 0 ? -1 : 1;
        let entQubit = "";
        //draw wire

        //type
        let gateType = "empty";
        if (d.gateName[0] == "_") {
          gateType = "customized";
          gateName = gateName.slice(1);
        } else if (
          opTypeDict[d.gateName] == "multi" ||
          opTypeDict[d.gateName] == "triple"
        ) {
          gateType =
            d.qubits[0] == focusQubit.toString() ? "control" : "target";
          entQubit =
            d.qubits[0] == focusQubit.toString()
              ? d.qubits[d.qubits.length - 1]
              : d.qubits[0];
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
            .attr("x", xPos + gridSize / 4)
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
            .attr("x", xPos + gridSize / 2)
            .attr("y", gridSize + parseInt(shape.style("font-size")) / 4)
            .text(gateName)
            .attr("text-anchor", "middle")
            .style("fill", colorDict[gateType]);
        }
        if (gateType === "control" || gateType === "target") {
          shape = d3.select(this).append("text");
          shape
            .style("font-size", (height / 8).toString() + "px")
            .attr("x", xPos + gridSize / 2)
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
              .attr("cx", xPos + gridSize / 2)
              .attr("cy", gridSize)
              .attr("r", gridSize / 15)
              .attr("fill", colorDict[gateType]);

            shape = d3.select(this).append("line");
            shape
              .attr("x1", xPos + gridSize / 2)
              .attr("y1", gridSize)
              .attr("x2", xPos + gridSize / 2)
              .attr("y2", gridSize + (diff * gridSize) / 2)
              .attr("stroke", colorDict[gateType]);
            break;
          case "target":
            shape = d3.select(this).append("circle");
            shape
              .attr("cx", xPos + gridSize / 2)
              .attr("cy", gridSize - (diff * gridSize) / 2)
              .attr("r", gridSize / 15)
              .attr("fill", colorDict[gateType]);

            shape = d3.select(this).append("line");
            shape
              .attr("x1", xPos + gridSize / 2)
              .attr("y1", gridSize - (diff * gridSize) / 4)
              .attr("x2", xPos + gridSize / 2)
              .attr("y2", gridSize - (diff * gridSize) / 2)
              .attr("stroke", colorDict[gateType]);
            break;
          default:
            console.log("Unknown shape type in provenance:", d.gateName);
            break;
        }
      });
    }
  }, [qubitPos]);

  useEffect(() => {
    //
    console.log("qubitData", qubitData);
    const minInterval = 30; //layerMinInterval 
    const svgWidth = 640;
    // const gateWidth = 20;
    let layerNum = 10;                                                  // todo : layerNum(need fix)
    if (qubitData !== undefined) {
      //TODO:calculation the interval
      let n = qubitData.length;
      let layerInterval = Math.min(svgWidth / layerNum, minInterval);

      let pos: number[]; // layer index 
      // let pre: number[]; // pre[pos] : before pos, there are pre[pos] gates
      pos = [];
      // pre = [];
      for (let i = 0; i < n; ++i) {
        pos[i] = qubitData[i].layer;
      }
      sort(pos);
      // for (let i = 0; i < n; ++i) {
      // pre[pos[i]] = i;
      // }
      let mnNum = pos[0];
      for (let i = 1; i < n; ++i) {
        mnNum = Math.min(mnNum, pos[i] - pos[i - 1]);
      }

      let totlength = 0; // real width                                      // todo : return 
      totlength = layerInterval * layerNum;

      const qubitPosition = qubitData?.map((item) => {
        return {
          gateName: item.gateName,
          qubits: item.qubits,
          x: item.layer * layerInterval + layerInterval / 2,
        };
      });
      setQubitPos(qubitPosition);
      console.log("qubitPosition", qubitPosition);
    }
  }, [qubitData]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          setQubitData(message.data.focusQubitGates);

          break;
        case "context.setTitle":
          // setPanelTitle(message.data.title);
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

export default ProvenancePanel;
