// import { ThemeColor } from "vscode";
import {
  BOLD_LINE_WIDTH,
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
  ctx.lineWidth = width < 50 ? LINE_WIDTH : BOLD_LINE_WIDTH;
  let maxWidth = width < 160 / 3 ? (width / 4) * 3 : 40;
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
      ctx.lineTo(xCoord + (width - maxWidth) / 2, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + width - (width - maxWidth) / 2, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      //square
      ctx.strokeStyle = SINGLE_GATE_STROKE;
      ctx.strokeRect(
        xCoord + (width - maxWidth) / 2,
        yCoord + (height - maxWidth) / 2,
        maxWidth,
        maxWidth
      );
      break;
    case "single_gate_middle":
      maxWidth = width < 80 ? (width / 4) * 3 : 60;
      ctx.beginPath();
      //lines
      ctx.strokeStyle = WIRE_STROKE;
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + (width - maxWidth) / 2, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + width - (width - maxWidth) / 2, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      // square
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xCoord + (width - maxWidth) / 2, yCoord);
      ctx.lineTo(xCoord + (width - maxWidth) / 2, yCoord + height);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + width - (width - maxWidth) / 2, yCoord);
      ctx.lineTo(xCoord + width - (width - maxWidth) / 2, yCoord + height);

      ctx.stroke();
      break;
    case "single_gate_middle_empty_bg":
      maxWidth = width < 80 ? (width / 4) * 3 : 60;
      // square
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xCoord + (width - maxWidth) / 2, yCoord);
      ctx.lineTo(xCoord + (width - maxWidth) / 2, yCoord + height);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + width - (width - maxWidth) / 2, yCoord);
      ctx.lineTo(xCoord + width - (width - maxWidth) / 2, yCoord + height);

      ctx.stroke();
      break;
    case "single_gate_up":
      maxWidth = width < 80 ? (width / 4) * 3 : 60;
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + (width - maxWidth) / 2, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + width - (width - maxWidth) / 2, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      // square
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xCoord + (width - maxWidth) / 2, yCoord + height);
      ctx.lineTo(
        xCoord + (width - maxWidth) / 2,
        yCoord + (width - maxWidth) / 2
      );
      ctx.lineTo(
        xCoord + width - (width - maxWidth) / 2,
        yCoord + (width - maxWidth) / 2
      );
      ctx.lineTo(xCoord + width - (width - maxWidth) / 2, yCoord + height);

      ctx.stroke();

      break;
    case "single_gate_up_empty_bg":
      maxWidth = width < 80 ? (width / 4) * 3 : 60;

      // square
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xCoord + (width - maxWidth) / 2, yCoord + height);
      ctx.lineTo(
        xCoord + (width - maxWidth) / 2,
        yCoord + (width - maxWidth) / 2
      );
      ctx.lineTo(
        xCoord + width - (width - maxWidth) / 2,
        yCoord + (width - maxWidth) / 2
      );
      ctx.lineTo(xCoord + width - (width - maxWidth) / 2, yCoord + height);

      ctx.stroke();

      break;
    case "single_gate_bottom":
      maxWidth = width < 80 ? (width / 4) * 3 : 60;
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      //lines
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + (width - maxWidth) / 2, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + width - (width - maxWidth) / 2, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      // square
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xCoord + (width - maxWidth) / 2, yCoord);
      ctx.lineTo(
        xCoord + (width - maxWidth) / 2,
        yCoord + height - (width - maxWidth) / 2
      );
      ctx.lineTo(
        xCoord + width - (width - maxWidth) / 2,
        yCoord + height - (width - maxWidth) / 2
      );
      ctx.lineTo(xCoord + width - (width - maxWidth) / 2, yCoord);
      // ctx.closePath();
      ctx.stroke();

      break;
    case "single_gate_bottom_empty_bg":
      maxWidth = width < 80 ? (width / 4) * 3 : 60;

      // square
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(xCoord + (width - maxWidth) / 2, yCoord);
      ctx.lineTo(
        xCoord + (width - maxWidth) / 2,
        yCoord + height - (width - maxWidth) / 2
      );
      ctx.lineTo(
        xCoord + width - (width - maxWidth) / 2,
        yCoord + height - (width - maxWidth) / 2
      );
      ctx.lineTo(xCoord + width - (width - maxWidth) / 2, yCoord);
      // ctx.closePath();
      ctx.stroke();

      break;
    case "ryy_gate_up":
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
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 8, yCoord + height);
      ctx.lineTo(xCoord + width / 8, yCoord + height / 8);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord + height / 8);
      ctx.lineTo(xCoord + (width / 8) * 7, yCoord + height);

      ctx.stroke();

      break;
    case "ryy_gate_bottom":
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
      ctx.strokeStyle = MULTI_GATE_STROKE;
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
    case "ctrl_middle":
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      ctx.fillStyle = MULTI_GATE_STROKE;
      ctx.arc(
        xCoord + width / 2,
        yCoord + height / 2,
        width / 15 < 4 ? width / 15 : 4,
        0,
        2 * Math.PI
      );
      ctx.fill();

      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + height);
      ctx.stroke();
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
        width / 15 < 4 ? width / 15 : 4,
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
    case "custom_ctrl_up":
      maxWidth = width < 80 ? (width / 4) * 3 : 60;
      ctx.strokeStyle = WIRE_STROKE;

      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.fillStyle = CUSTOM_GATE_STROKE;
      ctx.arc(
        xCoord + width / 2,
        yCoord + height / 2,
        width / 15 < 4 ? width / 15 : 4,
        0,
        2 * Math.PI
      );
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 2, yCoord + height + (width - maxWidth) / 2);
      ctx.stroke();
      break;
    case "custom_ctrl_bottom":
      maxWidth = width < 80 ? (width / 4) * 3 : 60;
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();

      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.fillStyle = CUSTOM_GATE_STROKE;
      ctx.arc(
        xCoord + width / 2,
        yCoord + height / 2,
        width / 15 < 4 ? width / 15 : 4,
        0,
        2 * Math.PI
      );
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord - (width - maxWidth) / 2);
      ctx.lineTo(xCoord + width / 2, yCoord + height / 2);
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
        width / 15 < 4 ? width / 15 : 4,
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
    case "vertical_line_empty_bg":
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + height);
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
      ctx.lineTo(xCoord + width / 8, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 7, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      //square
      ctx.strokeStyle = CUSTOM_GATE_STROKE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(
        xCoord + width / 8,
        yCoord + height / 4,
        (width / 4) * 3,
        height / 2
      );

      break;
    case "cy_up":
      //lines
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + (width - maxWidth) / 2, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + width - (width - maxWidth) / 2, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();
      //square
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.strokeRect(
        xCoord + (width - maxWidth) / 2,
        yCoord + (height - maxWidth) / 2,
        maxWidth,
        maxWidth
      );

      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord + height - (height - maxWidth) / 2);
      ctx.lineTo(xCoord + width / 2, yCoord + height);
      ctx.stroke();
      break;
    case "cy_down":
      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + (width - maxWidth) / 2, yCoord + height / 2);

      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(xCoord + width - (width - maxWidth) / 2, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);

      ctx.stroke();

      //square
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.strokeRect(
        xCoord + (width - maxWidth) / 2,
        yCoord + (height - maxWidth) / 2,
        maxWidth,
        maxWidth
      );
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + (height - maxWidth) / 2);

      ctx.stroke();
      break;
    case "swap_middle":
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + height);
      ctx.stroke();

      //swap
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 3, yCoord + (height / 8) * 3);
      ctx.lineTo(xCoord + (width / 8) * 5, yCoord + (height / 8) * 5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 5, yCoord + (height / 8) * 3);
      ctx.lineTo(xCoord + (width / 8) * 3, yCoord + (height / 8) * 5);
      ctx.stroke();

      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();
      break;
    case "swap_up":
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord + height / 2);
      ctx.lineTo(xCoord + width / 2, yCoord + height);
      //swap
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 3, yCoord + (height / 8) * 3);
      ctx.lineTo(xCoord + (width / 8) * 5, yCoord + (height / 8) * 5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 5, yCoord + (height / 8) * 3);
      ctx.lineTo(xCoord + (width / 8) * 3, yCoord + (height / 8) * 5);
      ctx.stroke();

      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();
      break;
    case "swap_down":
      ctx.strokeStyle = MULTI_GATE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord + width / 2, yCoord);
      ctx.lineTo(xCoord + width / 2, yCoord + height / 2);
      ctx.stroke();
      //swap
      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 3, yCoord + (height / 8) * 3);
      ctx.lineTo(xCoord + (width / 8) * 5, yCoord + (height / 8) * 5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(xCoord + (width / 8) * 5, yCoord + (height / 8) * 3);
      ctx.lineTo(xCoord + (width / 8) * 3, yCoord + (height / 8) * 5);
      ctx.stroke();

      ctx.strokeStyle = WIRE_STROKE;
      ctx.beginPath();
      ctx.moveTo(xCoord, yCoord + height / 2);
      ctx.lineTo(xCoord + width, yCoord + height / 2);
      ctx.stroke();
      break;
    default:
      break;
  }
  return null;
};

export default GridDrawing;
