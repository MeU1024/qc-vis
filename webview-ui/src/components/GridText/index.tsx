export interface GridTextProps {
  x: number;
  y: number;

  content: string;
}

// const lineDrawing = ()
const GridText = (props: GridTextProps) => {
  const { x, y, content } = props;
  const canvas = document.getElementById("overviewCanvas");
  if (canvas) {
    const ctx = (canvas as HTMLCanvasElement).getContext("2d");
    if (ctx) {
      ctx.font = "18px serif";
      ctx.fillStyle = "#cccccc";
      ctx.textBaseline = "middle";
      const text = ctx.measureText(content);
      ctx.fillText(content, x - text.width / 2, y);
    }
  }
  return null;
};

export default GridText;
