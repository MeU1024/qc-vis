import * as vscode from "vscode";
import * as qv from "../quantivine";
import { moveActiveEditor } from "../utilities/webview";
import { getLogger } from "./logger";
import { QCViewerManagerService } from "./viewerlib/qcviewermanager";
import { QCViewerPanelService } from "./viewerlib/qcviewerpanel";

const logger = getLogger("Viewer");

export class Viewer {
  async openTab(
    sourceFile: vscode.Uri,
    tabEditorGroup: string,
    preserveFocus: boolean
  ): Promise<void> {
    // TODO: Get data file from source file
    const dataUri = qv.getDefaultDataFile();
    return this.visualizeQCircuitInTab(dataUri, tabEditorGroup, preserveFocus);
  }

  async visualizeQCircuitInTab(
    dataUri: vscode.Uri,
    tabEditorGroup: string,
    preserveFocus: boolean
  ): Promise<void> {
    const activeDocument = vscode.window.activeTextEditor?.document;
    const panel = await QCViewerPanelService.createQCircuitViewerPanel(
      dataUri,
      tabEditorGroup === "current"
    );
    QCViewerManagerService.initiateQCViewerPanel(panel);
    if (!panel) {
      return;
    }
    if (tabEditorGroup !== "current" && activeDocument) {
      await moveActiveEditor(tabEditorGroup, preserveFocus);
    }
    logger.log(`Open visualization tab for ${dataUri.toString(true)}`);
  }

  private async checkViewer(sourceFile: vscode.Uri): Promise<boolean> {
    const dataUri = this.code2data(sourceFile);
    if (!(await qv.qvfs.exists(dataUri))) {
      logger.log(`Cannot find data file ${dataUri}`);
      logger.refreshStatus(
        "check",
        "statusBar.foreground",
        `Cannot view file data file. File not found: ${dataUri}`,
        "warning"
      );
      return false;
    }
    return true;
  }

  openExternal(): void {}

  updateHighlight(id: string) {
    const dataUri = vscode.Uri.file("");
    const panelSet = QCViewerManagerService.getPanelSet(dataUri);
    panelSet?.forEach((panel) => {
      panel.webviewPanel.webview.postMessage({
        command: "update",
        text: id,
      });
    });
  }

  updateTheme(theme: vscode.ColorTheme) {
    const dataUri = vscode.Uri.file("");
    const panelSet = QCViewerManagerService.getPanelSet(dataUri);
    panelSet?.forEach((panel) => {
      panel.webviewPanel.webview.postMessage({
        command: "themeChange",
        theme: theme,
      });
    });
  }

  private code2data(sourceFile: vscode.Uri): vscode.Uri {
    const dataFilePath = qv.manager.code2data(sourceFile);
    return vscode.Uri.file(dataFilePath);
  }
}
