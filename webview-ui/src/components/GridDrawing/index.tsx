export interface GridDrawingProps {
  x: number;
  y: number;
  width: number;
  height: number;
  op: string;
}

// const lineDrawing = ()
const GridDrawing = (props: GridDrawingProps) => {
  const { x, y, width, height, op } = props;
  const canvas = document.getElementById("overviewCanvas");
  if (canvas) {
    const ctx = (canvas as HTMLCanvasElement).getContext("2d");
    if (ctx) {
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 0.75;
      switch (op) {
        case "line":
          ctx.beginPath();
          ctx.moveTo(x, y + height / 2);
          ctx.lineTo(x + width, y + height / 2);

          ctx.stroke();
          break;
        case "single":
          ctx.beginPath();
          //lines
          ctx.moveTo(x, y + height / 2);
          ctx.lineTo(x + width / 8, y + height / 2);

          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + (width / 8) * 7, y + height / 2);
          ctx.lineTo(x + width, y + height / 2);

          ctx.stroke();
          //   square
          ctx.strokeRect(
            x + width / 8,
            y + height / 8,
            (width / 4) * 3,
            (height / 4) * 3
          );

          break;
        case "middle":
          ctx.beginPath();
          //lines
          ctx.moveTo(x, y + height / 2);
          ctx.lineTo(x + width / 8, y + height / 2);

          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + (width / 8) * 7, y + height / 2);
          ctx.lineTo(x + width, y + height / 2);

          ctx.stroke();
          // square
          ctx.beginPath();
          ctx.moveTo(x + width / 8, y);
          ctx.lineTo(x + width / 8, y + height);

          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + (width / 8) * 7, y);
          ctx.lineTo(x + (width / 8) * 7, y + height);

          ctx.stroke();
          break;
        case "up":
          ctx.beginPath();
          //lines
          ctx.moveTo(x, y + height / 2);
          ctx.lineTo(x + width / 8, y + height / 2);

          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + (width / 8) * 7, y + height / 2);
          ctx.lineTo(x + width, y + height / 2);

          ctx.stroke();
          // square
          ctx.beginPath();
          ctx.moveTo(x + width / 8, y + height);
          ctx.lineTo(x + width / 8, y + height / 8);
          ctx.lineTo(x + (width / 8) * 7, y + height / 8);
          ctx.lineTo(x + (width / 8) * 7, y + height);

          ctx.stroke();

          break;
        case "bottom":
          ctx.beginPath();
          //lines
          ctx.moveTo(x, y + height / 2);
          ctx.lineTo(x + width / 8, y + height / 2);

          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x + (width / 8) * 7, y + height / 2);
          ctx.lineTo(x + width, y + height / 2);

          ctx.stroke();
          // square
          ctx.beginPath();
          ctx.moveTo(x + width / 8, y);
          ctx.lineTo(x + width / 8, y + (height / 8) * 7);
          ctx.lineTo(x + (width / 8) * 7, y + (height / 8) * 7);
          ctx.lineTo(x + (width / 8) * 7, y);
          // ctx.closePath();
          ctx.stroke();

          break;
        default:
          break;
      }
    }
  }
  return null;
};

export default GridDrawing;
