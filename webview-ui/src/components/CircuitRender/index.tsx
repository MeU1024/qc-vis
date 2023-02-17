import GridDrawing from "../GridDrawing";

export interface CircuitRenderProp {
  graph: string[][];
  gridWidth: number;
  gridHeight: number;
  ctx: CanvasRenderingContext2D;
}

export const CircuitRender = (props: CircuitRenderProp) => {
  const { graph, gridWidth, gridHeight, ctx } = props;
  for (let col = 0; col < 11; col++) {
    for (let row = 0; row < 5; row++) {
      GridDrawing({
        x: col,
        y: row,
        width: gridWidth,
        height: gridHeight,
        ctx: ctx,
        op: graph[col][row],
      });
    }
  }
};
