import {
  WIRE_STROKE,
  LINE_WIDTH,
  BOLD_LINE_WIDTH,
  HIGHLIGHT_FRAME,
  HIGHLIGHT_FRAME_FILL,
  CUSTOM_GATE_STROKE,
} from "../const";

export interface HighlightBackgroundRenderProp {
  highlightRegions: {
    layer: number[];
    qubit: number[];
    name: string;
    weight: number;
  }[];
  gridWidth: number;
  gridHeight: number;
  ctx: CanvasRenderingContext2D;
}

export const HighlightBackgroundRender = (
  props: HighlightBackgroundRenderProp
) => {
  const { highlightRegions, gridWidth, gridHeight, ctx } = props;

  ctx.strokeStyle = HIGHLIGHT_FRAME;
  ctx.lineWidth = gridWidth < 50 ? LINE_WIDTH * 1.5 : BOLD_LINE_WIDTH * 1.5;
  highlightRegions.forEach((region) => {
    ctx.fillStyle =
      "rgba(194,191,226," + (region.weight * 0.05 + 0.05).toString() + ")";
    // "rgba(225,225,225," + (region.weight * 0.2 + 0.05).toString() + ")";
    const xCoord = region.layer[0] * gridWidth;
    const yCoord = region.qubit[0] * gridHeight;
    const width = (region.layer[1] - region.layer[0] + 1) * gridWidth;
    const height = (region.qubit[1] - region.qubit[0] + 1) * gridHeight;
    ctx.fillRect(xCoord, yCoord, width, height);
  });
};
