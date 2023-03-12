import { useState, useEffect } from "react";

export interface QubitPanelProps {
  theme: any;
  highlightGate: string | null;
}
const QubitPanel = (props: QubitPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("QubitPanel");

  return (
    <div className="panel">
      <div className="panelHeader">{panelTitle}</div>
      <div className="qubitView"></div>
    </div>
  );
};

export default QubitPanel;
