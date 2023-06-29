import * as vscode from 'vscode';
import * as qv from '../quantivine';
import * as fs from 'fs';
import {moveActiveEditor} from '../utilities/webview';
import {getLogger} from './logger';
import {QCViewerManagerService} from './viewerlib/qcviewermanager';
import {QCViewerPanelService} from './viewerlib/qcviewerpanel';
import {DataLoader} from '../providers/structurelib/dataloader';

const logger = getLogger('Viewer');

export class Viewer {
  async openTab(
    sourceFile: vscode.Uri,
    tabEditorGroup: string,
    preserveFocus: boolean
  ): Promise<void> {
    const dataUri = qv.manager.sourceFile || qv.getDefaultDataFile();
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
      tabEditorGroup === 'current'
    );
    QCViewerManagerService.initiateQCViewerPanel(panel);
    if (!panel) {
      return;
    }
    if (tabEditorGroup !== 'current' && activeDocument) {
      await moveActiveEditor(tabEditorGroup, preserveFocus);
    }
    logger.log(`Open visualization tab for ${dataUri.toString(true)}`);
  }

  refreshView() {
    const curDataUri = qv.manager.sourceFile || qv.getDefaultDataFile();
    const panelSet = QCViewerManagerService.getPanelSet(curDataUri);
    panelSet?.forEach((panel) => {
      panel.updateData();
    });
  }

  openExternal(): void {}

  updateHighlight(id: string) {
    const dataUri = vscode.Uri.file('');
    const panelSet = QCViewerManagerService.getPanelSet(dataUri);
    panelSet?.forEach((panel) => {
      panel.webviewPanel.webview.postMessage({
        command: 'update',
        text: id,
      });
    });
  }

  updateTheme(theme: vscode.ColorTheme) {
    const dataUri = vscode.Uri.file('');
    const panelSet = QCViewerManagerService.getPanelSet(dataUri);
    panelSet?.forEach((panel) => {
      panel.webviewPanel.webview.postMessage({
        command: 'themeChange',
        theme: theme,
      });
    });
  }
}
