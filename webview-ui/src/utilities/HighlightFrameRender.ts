import {
  WIRE_STROKE,
  LINE_WIDTH,
  BOLD_LINE_WIDTH,
  HIGHLIGHT_FRAME,
  HIGHLIGHT_FRAME_FILL,
} from "../const";

export interface HighlightFrameRenderProp {
  highlightRegions: {
    layer: number[];
    qubit: number[];
    name: string;
  }[];
  gridWidth: number;
  gridHeight: number;
  ctx: CanvasRenderingContext2D;
}

export const HighlightFrameRender = (props: HighlightFrameRenderProp) => {
  const { highlightRegions, gridWidth, gridHeight, ctx } = props;
  ctx.fillStyle = HIGHLIGHT_FRAME_FILL;
  ctx.strokeStyle = HIGHLIGHT_FRAME;
  ctx.lineWidth = gridWidth < 50 ? LINE_WIDTH * 1.5 : BOLD_LINE_WIDTH * 1.5;
  highlightRegions.forEach((region) => {
    const xCoord = region.layer[0] * gridWidth;
    const yCoord = region.qubit[0] * gridHeight;
    const width = (region.layer[1] - region.layer[0] + 1) * gridWidth;
    const height = (region.qubit[1] - region.qubit[0] + 1) * gridHeight;
    ctx.fillRect(xCoord, yCoord, width, height);
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(xCoord, yCoord, width, height);
    ctx.setLineDash([]);
  });
};
