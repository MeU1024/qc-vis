import * as vscode from 'vscode';
import * as qc from '../../quantivine';
import type {QCViewerPanel} from './qcviewerpanel';

export class QCViewerManagerService {
  private static readonly webviewPanelMap = new Map<
    string,
    Set<QCViewerPanel>
  >();

  private static toKey(dataFileUri: vscode.Uri): string {
    return dataFileUri.toString(true).toLocaleUpperCase();
  }

  static createWebviewSet(dataFileUri: vscode.Uri): void {
    const key = QCViewerManagerService.toKey(dataFileUri);
    if (!QCViewerManagerService.webviewPanelMap.has(key)) {
      QCViewerManagerService.webviewPanelMap.set(key, new Set());
    }
  }

  static getPanelSet(dataFileUri: vscode.Uri): Set<QCViewerPanel> | undefined {
    return QCViewerManagerService.webviewPanelMap.get(
      QCViewerManagerService.toKey(dataFileUri)
    );
  }

  static initiateQCViewerPanel(
    qcvPanel: QCViewerPanel
  ): QCViewerPanel | undefined {
    const dataFileUri = qcvPanel.dataFileUri;
    QCViewerManagerService.createWebviewSet(dataFileUri);
    const panelSet = QCViewerManagerService.getPanelSet(dataFileUri);
    if (!panelSet) {
      return;
    }
    panelSet.add(qcvPanel);
    qcvPanel.webviewPanel.onDidDispose(() => {
      panelSet.delete(qcvPanel);
    });
    return qcvPanel;
  }
}
