import { vscode } from "./utilities/vscode";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import OverviewPanel from "./containers/OverviewPanel";
import DetailPanel from "./containers/DetailPanel";
import DataFlowPanel from "./containers/DataFlowPanel";
import ParamPanel from "./containers/ParamPanel";
import "./App.scss";

function App() {
  function handleHowdyClick() {
    vscode.postMessage({
      command: "hello",
      text: "Hey there partner! 🤠",
    });
  }

  return (
    <main>
      {/* <h1>Hello World!</h1>
      <VSCodeButton onClick={handleHowdyClick}>Howdy!</VSCodeButton> */}

      <div className="MainContent">
        <OverviewPanel />
        <DetailPanel />
        <DataFlowPanel />
      </div>
      <ParamPanel />
    </main>
  );
}

export default App;
