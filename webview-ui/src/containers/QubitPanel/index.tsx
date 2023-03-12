import { useState, useEffect } from "react";

export interface QubitPanelProps {
  theme: any;
  highlightGate: string | null;
}
const generateQubitData = () => {
  return {
    output_size: [10, 3],
    op_map: { _HA: 0, cx: 1, _Ent: 6, rz: 5 },
    qbits: ["4"],
    all_gates: [
      [0, [0], [0]],
      [5, [1], [0]],
      [1, [2], [0]],
      [5, [3], [0]],
      [1, [3], [0]],
    ],
  };
};

const QubitPanel = (props: QubitPanelProps) => {
  const { theme, highlightGate } = props;

  const [panelTitle, setPanelTitle] = useState("QubitPanel");
  const [qubitData, setQubitData] = useState(generateQubitData());
  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;

      switch (message.command) {
        case "context.setCircuit":
          setQubitData(message.data.focusQubitGates);
          console.log(message);
          break;
        case "context.setTitle":
          setPanelTitle(message.data.title);
          break;
      }
    };
    window.addEventListener("message", handleMessageEvent);
    return () => {
      window.removeEventListener("message", handleMessageEvent);
    };
  }, []);
  return (
    <div className="panel">
      <div className="panelHeader">{panelTitle}</div>
      <div className="qubitView"></div>
    </div>
  );
};

export default QubitPanel;
