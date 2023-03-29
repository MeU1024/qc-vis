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
  IDLE_FILL,
  IDLE_STROKE,
} from "../../const";
import { sort } from "d3";

export interface ProvenancePanelProps {
  theme: any;
  highlightGate: string | null;
}
const generateQubitData = () => {
  return [
    { gateName: "_HA", qubits: ["0"], layer: [0, 0] },
    // { gateName: "rz", qubits: ["0"], layer: [1, 1] },
    // { gateName: "rz", qubits: ["0"], layer: [2, 2] },
    // { gateName: "cx", qubits: ["0", "1"], layer: [3, 3] },
    // { gateName: "cx", qubits: ["1", "0"], layer: [4, 4] },
    // { gateName: "cx", qubits: ["2", "1"], layer: [5, 5] },
    // { gateName: "cx", qubits: ["1", "2"], layer: [6, 6] },
    // { gateName: "_Ent", qubits: ["0"], layer: [7, 7] },
    // { gateName: "_Ent", qubits: ["0"], layer: [7, 7] },
  ];
};

const ProvenancePanel = (props: ProvenancePanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Qubit Provenance");
  const [qubitData, setQubitData] = useState<
    | undefined
    | {
        gateName: string;
        qubits: string[];
        layer: number[];
      }[]
  >(generateQubitData());
  const [qubitPos, setQubitPos] = useState<
    {
      gateName: string;
      qubits: string[];
      x: number;
    }[]
  >([]);
  const offset = 35;
  const [focusQubit, setFocusQubit] = useState(0);
  const [svgWidth, setSVGWidth] = useState(1040);
  const [realLength, setRealLength] = useState(1040);
  const [layerNum, setLayerNum] = useState<number | undefined>(20);
  // const width = 650;
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
        .attr("x2", svgWidth)
        .attr("y2", gridSize)
        .attr("stroke", WIRE_STROKE);

      let start = svg.append("line");
      start
        .attr("x1", (offset / 4) * 3)
        .attr("y1", (gridSize / 4) * 3)
        .attr("x2", (offset / 4) * 3)
        .attr("y2", (gridSize / 4) * 5)
        .attr("stroke", IDLE_STROKE);

      let end = svg.append("line");
      end
        .attr("x1", realLength + (offset / 4) * 4)
        .attr("y1", (gridSize / 4) * 3)
        .attr("x2", realLength + (offset / 4) * 4)
        .attr("y2", (gridSize / 4) * 5)
        .attr("stroke", IDLE_STROKE);

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
        let xPos = d.x + offset;
        let gateName = d.gateName;
        //TODO:3bit
        let diff = parseInt(d.qubits[0]) - parseInt(d.qubits[1]) > 0 ? -1 : 1;
        // let diff_2 =
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
          gateType === "target" ||
          d.gateName === "ryy"
        ) {
          shape = d3.select(this).append("rect");
          shape
            .attr("x", xPos - gridSize / 4)
            .attr("y", (gridSize / 4) * 3)
            .attr("width", gridSize / 2)
            .attr("height", gridSize / 2)
            .attr("rx", gridSize / 20)
            .attr("stroke", colorDict[gateType])
            .attr("fill", GATE_FILL)
            .attr("fill-opacity", GATE_FILL_OPACITY);
          if (gateName.length <= 3) {
            shape = d3.select(this).append("text");
            shape
              .style("font-size", (height / 6).toString() + "px")
              .attr("x", xPos)
              .attr("y", gridSize + parseInt(shape.style("font-size")) / 4)
              .text(gateName)
              .attr("text-anchor", "middle")
              .style("fill", colorDict[gateType]);
          } else {
            shape = d3.select(this).append("text");
            shape
              .style("font-size", (height / 6).toString() + "px")
              .attr("x", xPos)
              .attr(
                "y",
                gridSize +
                  parseInt(shape.style("font-size")) / 4 +
                  ((i % 2 === 0 ? -1 : 1) * gridSize) / 2
              )
              .text(gateName)
              .attr("text-anchor", "middle")
              .style("fill", colorDict[gateType]);
          }
        }

        //qubit text
        if (gateType === "control") {
          shape = d3.select(this).append("text");
          shape
            .style("font-size", (height / 8).toString() + "px")
            .attr("x", xPos)
            .attr(
              "y",
              gridSize +
                ((diff > 0 ? 1 : -1) * parseInt(shape.style("font-size"))) / 2 +
                ((diff > 0 ? 1 : -1) * gridSize) / 2
            )
            .text("q")
            .attr("text-anchor", "end")
            .style("fill", colorDict[gateType]);

          shape = d3.select(this).append("text");
          shape
            .style("font-size", (height / 12).toString() + "px")
            .attr("x", xPos)
            .attr(
              "y",
              gridSize +
                ((diff > 0 ? 1 : -1) * gridSize) / 2 +
                ((diff > 0 ? 1 : 0) * height) / 10
            )
            // height / 20

            .text(entQubit)
            .attr("text-anchor", "start")
            .style("fill", colorDict[gateType]);
        } else if (gateType === "target") {
          shape = d3.select(this).append("text");
          shape
            .style("font-size", (height / 8).toString() + "px")
            .attr("x", xPos)
            .attr(
              "y",
              gridSize +
                ((diff < 0 ? 1 : -1) * parseInt(shape.style("font-size"))) / 2 +
                ((diff < 0 ? 1 : -1) * gridSize) / 2
            )
            .text("q")
            .attr("text-anchor", "end")
            .style("fill", colorDict[gateType]);

          shape = d3.select(this).append("text");
          shape
            .style("font-size", (height / 12).toString() + "px")
            .attr("x", xPos)
            .attr(
              "y",
              gridSize +
                ((diff < 0 ? 1 : -1) * gridSize) / 2 +
                ((diff < 0 ? 1 : 0) * height) / 10
            )
            // height / 20

            .text(entQubit)
            .attr("text-anchor", "start")
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
              .attr("cx", xPos)
              .attr("cy", gridSize)
              .attr("r", gridSize / 15)
              .attr("fill", colorDict[gateType]);

            shape = d3.select(this).append("line");
            shape
              .attr("x1", xPos)
              .attr("y1", gridSize)
              .attr("x2", xPos)
              .attr("y2", gridSize + (diff * gridSize) / 2)
              .attr("stroke", colorDict[gateType]);
            break;
          case "target":
            shape = d3.select(this).append("circle");
            shape
              .attr("cx", xPos)
              .attr("cy", gridSize - diff * (gridSize / 2 - gridSize / 15))
              .attr("r", gridSize / 15)
              .attr("fill", colorDict[gateType]);

            shape = d3.select(this).append("line");
            shape
              .attr("x1", xPos)
              .attr("y1", gridSize - (diff * gridSize) / 4)
              .attr("x2", xPos)
              .attr("y2", gridSize - (diff * gridSize) / 2)
              .attr("stroke", colorDict[gateType]);
            break;
          default:
            console.log("Unknown shape type in provenance:", d.gateName);
            break;
        }
      });
    }
  }, [qubitPos, svgWidth]);

  useEffect(() => {
    //

    console.log("qubitData", qubitData);

    // const minInterval = 0; //layerMinInterval

    const posWidth = svgWidth - offset * 2;
    const gateWidth = 20;
    console.log("layerNumUndefined", layerNum === undefined);
    if (qubitData !== undefined && layerNum !== undefined) {
      //TODO:calculation the interval
      console.log("layerNum", layerNum);
      let n = qubitData.length;
      let totIntervalLayer = layerNum - 1;
      for (let i = 0; i < n; ++i) {
        totIntervalLayer -= qubitData[i].layer[1] - qubitData[i].layer[0];
      }
      let preIntervalNum: number[]; // preInterval[pos] : before pos, there are preInterval[pos] interval numbers
      preIntervalNum = [];
      preIntervalNum[0] = qubitData[0].layer[0];
      for (let i = 1; i < n; ++i) {
        preIntervalNum[i] =
          preIntervalNum[i - 1] +
          qubitData[i].layer[0] -
          qubitData[i - 1].layer[1];
      }
      console.log("totIntervalLayer", totIntervalLayer);
      let unitInterval = 0;
      if (totIntervalLayer == 0) {
        unitInterval = 1;
      } else {
        unitInterval = Math.floor(
          (posWidth - n * gateWidth) / totIntervalLayer
        );
      }
      unitInterval = Math.max(1, unitInterval);
      //TODO:return
      let totlength = 0; // real width
      totlength = Math.ceil(gateWidth * n + unitInterval * totIntervalLayer);
      console.log("unitInterval : ", unitInterval);
      const qubitPosition = qubitData?.map((item, index) => {
        return {
          gateName: item.gateName,
          qubits: item.qubits,
          x:
            preIntervalNum[index] * unitInterval +
            gateWidth / 2 +
            index * gateWidth,
        };
      });
      console.log("totlength", totlength);
      setRealLength(totlength);
      setQubitPos(qubitPosition);
      console.log("qubitPosition : ", qubitPosition);
    }
  }, [qubitData, layerNum]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          // setQubitData(message.data.focusQubitGates);
          console.log("size", message.data.originalCircuitSize);
          setLayerNum(message.data.originalCircuitSize[1]);
          break;
        case "context.setProvenance":
          setQubitData(message.data.focusQubitGates);
          setFocusQubit(message.data.focusQubit);

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
    <div className="panel" id="provenancePanel">
      <div className="panelHeader">
        <span className="title">{panelTitle}</span>
      </div>
      <div className="qubitView" style={{ overflow: "hidden" }}>
        {/* <div className="qubitTitle">Qubit {focusQubit}</div> */}
        <div>
          {" "}
          <span
            className="title-q"
            style={{
              textAlign: "center",
            }}
          >
            q
          </span>
          <span
            className="title-num"
            style={{
              fontSize: "8px",
              verticalAlign: "sub",
            }}
          >
            {" " + focusQubit}
          </span>
        </div>
        <svg
          id="qubitSVG"
          viewBox={"0 0 " + svgWidth + " " + height}
          width={svgWidth}
          height={height}
        ></svg>
      </div>
      {/* <div className="divider"></div> */}
    </div>
  );
};

export default ProvenancePanel;
