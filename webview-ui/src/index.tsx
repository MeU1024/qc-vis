import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import {
  provideVSCodeDesignSystem,
  vsCodeDataGrid,
  vsCodeDataGridCell,
  vsCodeDataGridRow,
  vsCodeDivider,
} from "@vscode/webview-ui-toolkit";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

provideVSCodeDesignSystem().register(
  vsCodeDataGrid(),
  vsCodeDataGridCell(),
  vsCodeDataGridRow(),
  vsCodeDivider()
);
