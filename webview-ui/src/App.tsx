import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import OverviewPanel from "./containers/OverviewPanel";
import DetailPanel from "./containers/DetailPanel";
import DataFlowPanel from "./containers/DataFlowPanel";
import ParamPanel from "./containers/ParamPanel";
import "./App.scss";
import { useEffect, useState } from "react";
import ConnectivityPanel from "./containers/ConnectivityPanel";
import QubitPanel from "./containers/QubitPanel";
import ParallelismPanel from "./containers/ParallelismPanel";

function App() {
  function handleHowdyClick() {
    vscode.postMessage({
      command: "hello",
      text: "Hey there partner! 🤠",
    });
  }
  const [highlightGate, setHighlightGate] = useState<string | null>(null);
  const [theme, setTheme] = useState<number | null>(null);
  const handleMessage = (event: MessageEvent<any>) => {
    const message = event.data; // The JSON data our extension sent
    switch (message.command) {
      case "update":
        setHighlightGate(message.text);
        break;
      case "themeChange":
        setTheme(message.theme);
        break;
    }
  };

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);
  return (
    <main>
      <div className="MainContent">
        <OverviewPanel highlightGate={highlightGate} theme={theme} />
        <div className="BottomContent">
          <div className="BottomLeft">
            <DetailPanel highlightGate={highlightGate} theme={theme} />
            <QubitPanel highlightGate={highlightGate} theme={theme} />
          </div>
          <div className="BottomRight">
            <ParallelismPanel theme={theme} highlightGate={highlightGate} />
            <ConnectivityPanel theme={theme} highlightGate={highlightGate} />
          </div>
        </div>
      </div>
      {/* <ParamPanel /> */}
    </main>
  );
}

export default App;
