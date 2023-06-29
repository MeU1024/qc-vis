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
    // fix datauri
    const dataUri = qv.manager.sourceFile || qv.getDefaultDataFile();
    return this.visualizeQCircuitInTab(dataUri, tabEditorGroup, preserveFocus);
  }

  async visualizeQCircuitInTab(
    dataUri: vscode.Uri,
    tabEditorGroup: string,
    preserveFocus: boolean
  ): Promise<void> {
    async function readFileIfExists(filename: string): Promise<string | null> {
      return new Promise((resolve, reject) => {
        const interval = setInterval(() => {
          if (fs.existsSync(filename)) {
            clearInterval(interval);
            fs.readFile(filename, 'utf8', (err, data) => {
              if (err) {
                reject(err);
              } else {
                resolve(data);
              }
            });
          }
        }, 1000); // 每隔1秒检查一次文件是否存在
      });
    }
    if (qv.manager.algorithm === undefined) {
      throw new Error('algorithm not found');
    }
    let dataloader = new DataLoader(qv.manager.algorithm);
    const gatesDataFile = dataloader.gatesDataFile;
    if (gatesDataFile == undefined) {
      throw new Error('gatesDataFile not found');
    }
    await readFileIfExists(gatesDataFile.fsPath);
    console.log('fs.existsSync(filename)', fs.existsSync(gatesDataFile.fsPath));

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
