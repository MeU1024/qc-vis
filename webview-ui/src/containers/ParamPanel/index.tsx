import "./index.scss";
import {
  VSCodeDataGrid,
  VSCodeDataGridCell,
  VSCodeDataGridRow,
} from "@vscode/webview-ui-toolkit/react";

const ParamPanel = () => {
  const rowsData = [
    {
      Name: "H1",
      Value: "0.35",
    },
    {
      Name: "H2",
      Value: "0.90",
    },
    {
      Name: "H3",
      Value: "0.55",
    },
  ];

  return (
    <div className="paramPanel">
      <div className="panelHeader"> Parameter</div>
      {/* <div className="circuit"></div> */}

      <VSCodeDataGrid>
        <VSCodeDataGridRow row-type="header">
          <VSCodeDataGridCell cell-type="columnheader" grid-column="1">
            Name
          </VSCodeDataGridCell>
          <VSCodeDataGridCell cell-type="columnheader" grid-column="2">
            Value
          </VSCodeDataGridCell>
        </VSCodeDataGridRow>
        {rowsData.map((row) => (
          <VSCodeDataGridRow>
            <VSCodeDataGridCell grid-column="1">{row.Name}</VSCodeDataGridCell>
            <VSCodeDataGridCell grid-column="2">{row.Value}</VSCodeDataGridCell>
          </VSCodeDataGridRow>
        ))}
      </VSCodeDataGrid>
    </div>
  );
};

export default ParamPanel;
