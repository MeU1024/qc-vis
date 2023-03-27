import * as d3 from "d3";
import {
  colorDict,
  GATE_FILL,
  GATE_FILL_OPACITY,
  IDLE_FILL,
  IDLE_STROKE,
  MATRIX_BG,
  opTypeDict,
  PARA_HIGH_FILL,
  PARA_LOW_FILL,
  SINGLE_GATE_STROKE,
  WIRE_STROKE,
} from "../const";

export interface extentRenderProps {
  width: number;
  height: number;
  gridSize: number;
  circuit: {
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: ((number | number[])[] | (number | number[])[][])[];
  };
  averageIdleValue: number[][];
  idlePosition: number[][][];
  focusIndex: number | undefined;
  focusLayer: number | undefined;
  offsetX: number;
  offsetY: number;
  layerRangeStart: number;
  qubitRangeStart: number;
  layerPosition: number[];
  paraBarData: number[];
  gridNumber: number;
  posLayerMap: number[];
  layerPosMap: number[];
  layerWidth: number[];
}

const colorScale = d3
  .scaleLinear<string>()
  .domain([0, 1])
  .range([PARA_LOW_FILL, PARA_HIGH_FILL]);

export const extentRender = (props: extentRenderProps) => {
  const {
    circuit,
    width,
    height,
    gridSize,
    averageIdleValue,
    idlePosition,
    focusIndex,
    offsetX,
    offsetY,
    layerRangeStart,
    qubitRangeStart,
    layerPosition,
    paraBarData,
    focusLayer,
    gridNumber,
    posLayerMap,
    layerPosMap,
    layerWidth,
  } = props;

  // const wiresData = [0, 0.2, 0.6, 1, 0.4, 0, 0];

  const minLayer = layerPosition[0];
  const maxLayer = layerPosition[layerPosition.length - 1];
  const leftLength = new Array(gridNumber).fill(0);
  const rightLength = new Array(gridNumber).fill(0);
  const leftColor: number[] = new Array(gridNumber).fill(0);
  const rightColor: number[] = new Array(gridNumber).fill(0);
  if (
    focusLayer !== undefined &&
    focusIndex !== undefined &&
    averageIdleValue !== undefined &&
    idlePosition !== undefined
  ) {
    if (idlePosition[layerPosition[focusIndex]].length !== 0) {
      const slicedIdlePosition = idlePosition[focusLayer].slice(
        qubitRangeStart,
        qubitRangeStart + gridNumber
      );
      slicedIdlePosition.forEach((idlePosArray: number[], index) => {
        idlePosArray.forEach((layerIndex) => {
          if (layerIndex < minLayer) {
            leftLength[index]++;
            leftColor[index] += paraBarData[layerIndex];
          } else if (layerIndex > maxLayer) {
            rightLength[index]++;
            rightColor[index] += paraBarData[layerIndex];
          }
        });
      });
    }
  }

  var svg = d3.select("#leftExtentSVG");
  svg.selectAll("*").remove();
  var rects = svg.selectAll("rect").data(leftLength).enter();
  rects
    .append("rect")
    .attr("x", (d) => 40 - d)
    .attr("y", function (d, i) {
      return i * gridSize + gridSize / 2;
    })
    .attr("width", (d) => d)
    .attr("height", 1)
    .style("fill", (d, i) => colorScale(leftColor[i]));

  var svg = d3.select("#rightExtentSVG");
  svg.selectAll("*").remove();
  var rects = svg.selectAll("rect").data(rightLength).enter();
  rects
    .append("rect")
    .attr("x", 0)
    .attr("y", function (d, i) {
      return i * gridSize + gridSize / 2;
    })
    .attr("width", (d) => d)
    .attr("height", 1)
    .style("fill", (d, i) => colorScale(rightColor[i]));
};
