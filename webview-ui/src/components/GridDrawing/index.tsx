import { LINE_WIDTH, STROKE_STYLE } from "../../const";

export interface GridDrawingProps {
  x: number;
  y: number;
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  op: string;
}

const GridDrawing = (props: GridDrawingProps) => {
  const { x, y, width, ctx, height, op } = props;
  const xCoord = x * width;
  const yCoord = y * height;
  ctx.strokeStyle = STROKE_STYLE;
  ctx.lineWidth = LINE_WIDTH;
  switch (op) {
    case "line":
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();
      break;
    case "single":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      //square
      ctx.strokeRect(
        xCoord + width / 8,
        yCoord + height / 8,
        (width / 4) * 3,
        (height / 4) * 3
      );
      break;
    case "middle":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      // square
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 8, yCoord);
      ctx.lineTo(xCoord + width / 8, yCoord + height);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord + height);

      ctx.stroke();
      break;
    case "up":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      // square
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 8, yCoord + height);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 8);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord + height / 8);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord + height);

      ctx.stroke();

      break;
    case "bottom":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      // square
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 8, yCoord);
      ctx.lineTo(xCoord + width / 8, yCoord + (height / 8) * 7);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord + (height / 8) * 7);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord);
      // ctx.closePath();
      ctx.stroke();

      break;
    case "empty":
      break;
    case "dots":
      break;
    default:
      break;
  }
  return null;
};

export default GridDrawing;
