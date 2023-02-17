export interface GridTextProps {
  x: number[];
  y: number[];
  width: number;
  height: number;
  ctx: CanvasRenderingContext2D;
  content: string;
}

const GridText = (props: GridTextProps) => {
  const { x, y, content, width, height, ctx } = props;
  const xPos =
    x.reduce((sum, value) => {
      return sum + value;
    }, 0) / x.length;
  const yPos =
    y.reduce((sum, value) => {
      return sum + value;
    }, 0) / y.length;
  ctx.font = "18px serif";
  ctx.fillStyle = "#cccccc";
  ctx.textBaseline = "middle";
  const text = ctx.measureText(content);
  const xCoord = xPos * width + width / 2 - text.width / 2;
  const yCoord = yPos * height + height / 2;
  ctx.fillText(content, xCoord, yCoord);
  return null;
};

export default GridText;
