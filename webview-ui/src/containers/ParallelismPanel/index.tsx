import { useState, useEffect } from "react";

export interface ParallelismPanelProps {
  theme: any;
  highlightGate: string | null;
}
const ParallelismPanel = (props: ParallelismPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("Idel Qubit | Parallelism");

  return (
    <div className="panel">
      <div className="panelHeader">{panelTitle}</div>
      <div className="qubitView"></div>
    </div>
  );
};

export default ParallelismPanel;
