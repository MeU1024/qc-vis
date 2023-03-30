import {
  WIRE_STROKE,
  LINE_WIDTH,
  BOLD_LINE_WIDTH,
  HIGHLIGHT_FRAME,
  HIGHLIGHT_FRAME_FILL,
  CUSTOM_GATE_STROKE,
} from "../const";

export interface HighlightFrameRenderProp {
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

export const HighlightFrameRender = (props: HighlightFrameRenderProp) => {
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

    ctx.setLineDash([4, 6]);
    ctx.strokeRect(xCoord, yCoord, width, height);
    ctx.setLineDash([]);

    //add text
    ctx.textBaseline = "bottom";

    ctx.font =
      (gridWidth * 0.4 < 16 ? gridWidth * 0.4 : 16).toString() + "px system-ui";
    ctx.fillStyle = HIGHLIGHT_FRAME;
    const text = ctx.measureText(region.name);
    ctx.fillText(
      region.name,
      xCoord + width / 2 - text.width / 2,
      yCoord == 0 ? gridHeight / 2 : yCoord
    );
  });
};
