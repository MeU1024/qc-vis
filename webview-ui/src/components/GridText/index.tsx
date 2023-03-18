import {
  CUSTOM_GATE_STROKE,
  FILL_STYLE,
  MULTI_GATE_STROKE,
  SINGLE_GATE_STROKE,
} from "../../const";

export interface GridTextProps {
  x: number[];
  y: number[];
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  content: string;
  fillStyle: string;
}

const GridText = (props: GridTextProps) => {
  const { x, y, width, height, ctx, fillStyle } = props;
  let content = props.content;
  const xPos =
    x.reduce((sum, value) => {
      return sum + value;
    }, 0) / x.length;
  const yPos =
    y.reduce((sum, value) => {
      return sum + value;
    }, 0) / y.length;
  ctx.font = (width * 0.4 < 28 ? width * 0.4 : 28).toString() + "px serif";
  ctx.fillStyle = fillStyle.length == 0 ? FILL_STYLE : fillStyle;
  if (content[0] == "_") {
    ctx.fillStyle = CUSTOM_GATE_STROKE;
    content = content.substring(1);
  } else if (
    content == "rz" ||
    content == "rx" ||
    content == "ry" ||
    content == "h" ||
    content == "p"
  ) {
    ctx.fillStyle = SINGLE_GATE_STROKE;
  } else if (
    content == "cz" ||
    content == "cx" ||
    content == "cy" ||
    content == "cp" ||
    content == "ryy"
  ) {
    ctx.fillStyle = MULTI_GATE_STROKE;
  } else if (content == "cry") {
    ctx.fillStyle = MULTI_GATE_STROKE;
    content = "ry";
  }
  ctx.textBaseline = "middle";
  const text = ctx.measureText(content);
  const xCoord = xPos * width + width / 2 - text.width / 2;
  const yCoord = yPos * height + height / 2;
  ctx.fillText(content, xCoord, yCoord);
  return null;
};

export default GridText;
