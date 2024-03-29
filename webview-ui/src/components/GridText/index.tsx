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
  ctx.font = (width * 0.4 < 20 ? width * 0.4 : 20).toString() + "px system-ui";
  // ctx.fillStyle = fillStyle.length == 0 ? FILL_STYLE : fillStyle;
  ctx.fillStyle = CUSTOM_GATE_STROKE;
  if (content[0] == "_") {
    ctx.fillStyle = CUSTOM_GATE_STROKE;
    content = content.substring(1);
    if (content[0] == "c") {
      content = content.substring(1);
    }
  } else if (
    content == "x" ||
    content == "y" ||
    content == "z" ||
    content == "h" ||
    content == "s" ||
    content == "sdg" ||
    content == "t" ||
    content == "tdg" ||
    content == "rz" ||
    content == "rx" ||
    content == "ry" ||
    content == "u" ||
    content == "p" ||
    content == "i" ||
    content == "id"
  ) {
    ctx.fillStyle = SINGLE_GATE_STROKE;
  } else if (
    content == "cz" ||
    content == "cx" ||
    content == "cy" ||
    content == "cp" ||
    content == "ch" ||
    content == "cu" ||
    content == "ryy" 
  ) {
    ctx.fillStyle = MULTI_GATE_STROKE;
  } else if (content == "cry" || content == "ccx" || content == "crz") {
    ctx.fillStyle = MULTI_GATE_STROKE;
  } else if (content == "···" || content == "...") {
    ctx.fillStyle = "black";
  }
  ctx.textBaseline = "middle";

  var lines = content.split(" ");
  var lineheight = 20;
  var fontSize = width * 0.4;
  //

  for (var i = 0; i < lines.length; i++) {
    let text = ctx.measureText(lines[i]);
    if (text.width > (width / 4) * 3) {
      ctx.font =
        ((width * 0.4 < 20 ? width * 0.4 : 20) * 0.8).toString() +
        "px system-ui ";
      text = ctx.measureText(lines[i]);
      fontSize = (width * 0.4 < 20 ? width * 0.4 : 20) * 0.8;
    }
  }

  var linesHeight = fontSize * lines.length + lineheight * (lines.length - 1);

  for (var i = 0; i < lines.length; i++) {
    let text = ctx.measureText(lines[i]);

    const xCoord = xPos * width + width / 2 - text.width / 2;
    const yCoord =
      yPos * height +
      height / 2 -
      linesHeight / 2 +
      fontSize / 2 +
      i * fontSize +
      i * lineheight;
    ctx.fillText(lines[i], xCoord, yCoord);
  }

  return null;
};

export default GridText;
