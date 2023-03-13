import { useState, useEffect } from "react";
import "./index.scss";
import * as d3 from "d3";
import { PARA_HIGH_FILL, PARA_LOW_FILL } from "../../const";

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
  const [focusLayer, setFocusLayer] = useState(0);
  const [paraData, setParaData] = useState(geneParaData());

  const width = 350;
  const height = 350;
  const paraBarwidth = 350;
  const paraBarheight = 10;

  const colorScale = d3
    .scaleLinear<string>()
    .domain([0, 1])
    .range([PARA_LOW_FILL, PARA_HIGH_FILL]);

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
    // var shapes = svg.selectAll("g").data(paraData).enter().append("g");
    // for (let index = 0; index < rectNumber - 1; index++) {
    //   var gradient = svg
    //     .append("defs")
    //     .append("linearGradient")
    //     .attr("id", "myGradient" + index.toString())
    //     .attr("x1", "0%")
    //     .attr("y1", "0%")
    //     .attr("x2", "100%")
    //     .attr("y2", "0%");

    //   gradient
    //     .append("stop")
    //     .attr("offset", "0%")
    //     .attr("stop-color", colorScale(paraData[index]));

    //   gradient
    //     .append("stop")
    //     .attr("offset", "100%")
    //     .attr("stop-color", colorScale(paraData[index + 1]));
    // }

    // shapes.each(function (d, i) {
    //   var shape;

    //   shape = d3.select(this).append("rect");
    //   // Draw the rectangle
    //   shape
    //     .attr("x", i == 0 ? 0 : i * rectWidth + rectWidth / 4)
    //     .attr("y", 0)
    //     .attr(
    //       "width",
    //       (i == 0 || i == rectNumber - 1
    //         ? (rectWidth / 4) * 3
    //         : rectWidth / 2) + 0.5
    //     )
    //     .attr("height", paraBarheight)
    //     // .attr("margin", "-1px")
    //     .style("stroke-width", 0)
    //     // .style("fill", colorScale(0));
    //     .style("fill", colorScale(d));

    //   shape = d3.select(this).append("rect");
    //   // Draw the gradient rectangle
    //   shape
    //     .attr("x", i * rectWidth + (rectWidth / 4) * 3)
    //     .attr("y", 0)
    //     .attr("width", rectWidth / 2 + 0.5)
    //     .attr("height", paraBarheight)
    //     .style("stroke-width", 0)
    //     // .style("fill", colorScale(0));
    //     .style("fill", "url(#myGradient" + i.toString() + ")");
    // });
  }, [paraData]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          setParaData(message.data.layerParallelism);
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
            viewBox={"0 0 " + width + " " + height}
            width={width}
            height={height}
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

export default ParallelismPanel;
