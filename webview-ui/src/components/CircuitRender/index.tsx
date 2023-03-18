import GridDrawing from "../GridDrawing";

export interface CircuitRenderProp {
  graph: number[][];
  gridWidth: number;
  gridHeight: number;
  ctx: CanvasRenderingContext2D;
}

export const CircuitRender = (props: CircuitRenderProp) => {
  const { graph, gridWidth, gridHeight, ctx } = props;
  const cols = graph.length;
  const rows = graph[0].length;
  var style = getComputedStyle(document.getElementsByClassName("panel")[0]);
  const color = style.getPropertyValue("--stroke-style");
  // console.log('Render', ctx, cols, rows);
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      GridDrawing({
        x: col,
        y: row,
        width: gridWidth,
        height: gridHeight,
        ctx: ctx,
        op: graph[col][row],
        strokeStyle: color,
        fillStyle: color,
      });
    }
  }
};
