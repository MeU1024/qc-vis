import GridText from "../GridText";
export interface CircuitAnnotatorProp {
  graphText: { x: number[]; y: number[]; content: string }[];
  gridWidth: number;
  gridHeight: number;
  ctx: CanvasRenderingContext2D;
}

export const CircuitAnnotator = (props: CircuitAnnotatorProp) => {
  const { graphText, ctx, gridWidth, gridHeight } = props;
  graphText.forEach((item) => {
    GridText({
      x: item.x,
      y: item.y,
      width: gridWidth,
      height: gridHeight,
      ctx: ctx,
      content: item.content,
    });
  });
};
