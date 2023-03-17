// import { ThemeColor } from "vscode";
import {
  CUSTOM_GATE_STROKE,
  FILL_STYLE,
  LINE_WIDTH,
  MULTI_GATE_STROKE,
  opList,
  SINGLE_GATE_STROKE,
  STROKE_STYLE,
  WIRE_STROKE,
} from "../../const";
//import { vscode } from "../../utilities/vscode";

export interface GridDrawingProps {
  x: number;
  y: number;
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  op: number;
  strokeStyle: string;
  fillStyle: string;
}

const GridDrawing = (props: GridDrawingProps) => {
  const { x, y, width, ctx, height, op, strokeStyle, fillStyle } = props;
  const xCoord = x * width;
  const yCoord = y * height;

  // ctx.strokeStyle = strokeStyle;
  ctx.fillStyle = fillStyle.length == 0 ? FILL_STYLE : fillStyle;
  ctx.lineWidth = LINE_WIDTH;

  switch (opList[op]) {
    case "horizon_line":
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();
      break;
    case "single_gate":
      ctx.beginPath();
      //lines
      ctx.strokeStyle = WIRE_STROKE;
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      //square
      ctx.strokeStyle = SINGLE_GATE_STROKE;
      ctx.strokeRect(
        xCoord + width / 8,
        yCoord + height / 8,
        (width / 4) * 3,
        (height / 4) * 3
      );
      break;
    case "single_gate_middle":
      ctx.beginPath();
      //lines
      ctx.strokeStyle = WIRE_STROKE;
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      // square
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 8, yCoord);
      ctx.lineTo(xCoord + width / 8, yCoord + height);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord + height);

      ctx.stroke();
      break;
    case "single_gate_up":
      ctx.strokeStyle = WIRE_STROKE;
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
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 8, yCoord + height);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 8);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord + height / 8);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord + height);

      ctx.stroke();

      break;
    case "single_gate_bottom":
      ctx.strokeStyle = WIRE_STROKE;
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
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
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
    case "ctrl_up":
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      ctx.fillStyle = MULTI_GATE_STROKE;
      ctx.arc(
        xCoord + width / 2,
        yCoord + height / 2,
        width / 15,
        0,
        2 * Math.PI
      );
      ctx.fill();

      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 2, yCoord + height);
      ctx.stroke();
      break;
    case "ctrl_down":
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.fillStyle = MULTI_GATE_STROKE;
      ctx.arc(
        xCoord + width / 2,
        yCoord + height / 2,
        width / 15,
        0,
        2 * Math.PI
      );
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + height / 2);
      ctx.stroke();
      break;
    case "vertical_line":
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + height);
      ctx.stroke();

      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();
      break;
    case "cx_up":
      //gate
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.beginPath();
      ctx.arc(
        xCoord + width / 2,
        yCoord + height / 2,
        width / 4,
        0,
        2 * Math.PI
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 3, yCoord + height / 2);
      ctx.lineTo(xCoord + (width / 8) * 5, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord + (height / 8) * 3);
      ctx.lineTo(xCoord + width / 2, yCoord + (height / 8) * 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord + (height / 4) * 3);
      ctx.lineTo(xCoord + width / 2, yCoord + height);
      ctx.stroke();

      //lines
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 4, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 4) * 3, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      break;
    case "cx_down":
      //gate
      ctx.beginPath();
      ctx.arc(
        xCoord + width / 2,
        yCoord + height / 2,
        width / 4,
        0,
        2 * Math.PI
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 3, yCoord + height / 2);
      ctx.lineTo(xCoord + (width / 8) * 5, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord + (height / 8) * 3);
      ctx.lineTo(xCoord + width / 2, yCoord + (height / 8) * 5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + height / 4);
      ctx.stroke();

      //lines
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 4, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 4) * 3, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      break;
    case "multi_gate_left_up":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 4, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + width / 4, yCoord + height);
      ctx.lineTo(xCoord + width / 4, yCoord + height / 4);
      ctx.lineTo(xCoord + width, yCoord + height / 4);
      ctx.stroke();

      break;
    case "multi_gate_right_up":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord + (width / 4) * 3, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 4) * 3, yCoord + height);
      ctx.lineTo(xCoord + (width / 4) * 3, yCoord + height / 4);
      ctx.lineTo(xCoord, yCoord + height / 4);
      ctx.stroke();
      break;
    case "multi_gate_left_bottom":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 4, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + width / 4, yCoord);
      ctx.lineTo(xCoord + width / 4, yCoord + (height / 4) * 3);
      ctx.lineTo(xCoord + width, yCoord + (height / 4) * 3);
      ctx.stroke();
      break;
    case "multi_gate_right_bottom":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord + (width / 4) * 3, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 4) * 3, yCoord);
      ctx.lineTo(xCoord + (width / 4) * 3, yCoord + (height / 4) * 3);
      ctx.lineTo(xCoord, yCoord + (height / 4) * 3);
      ctx.stroke();
      break;
    case "multi_gate_left":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 4, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + width / 4, yCoord);
      ctx.lineTo(xCoord + width / 4, yCoord + height);
      ctx.stroke();
      break;
    case "multi_gate_right":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord + (width / 4) * 3, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 4) * 3, yCoord);
      ctx.lineTo(xCoord + (width / 4) * 3, yCoord + height);
      ctx.stroke();
      break;
    case "multi_gate_bottom":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + (height / 4) * 3);
      ctx.lineTo(xCoord + width, yCoord + (height / 4) * 3);
      ctx.stroke();

      break;
    case "multi_gate_up":
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 4);
      ctx.lineTo(xCoord + width, yCoord + height / 4);
      ctx.stroke();
    case "custom_gate":
      ctx.beginPath();
      //lines
      ctx.strokeStyle = WIRE_STROKE;
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 4, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 4) * 3, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      //square

      ctx.strokeRect(
        xCoord + width / 4,
        yCoord + height / 8,
        width / 2,
        (height / 4) * 3
      );

      break;
    case "cy_up":
      //lines
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      //square
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.strokeRect(
        xCoord + width / 8,
        yCoord + height / 8,
        (width / 4) * 3,
        (height / 4) * 3
      );
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + height / 8);
      break;
    case "cy_down":
      ctx.strokeStyle = WIRE_STROKE;
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
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.strokeRect(
        xCoord + width / 8,
        yCoord + height / 8,
        (width / 4) * 3,
        (height / 4) * 3
      );
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + height / 8);

      ctx.stroke();
      break;
    default:
      break;
  }
  return null;
};

export default GridDrawing;
