import * as vscode from 'vscode';
import * as qv from './quantivine';
import {getLogger} from './components/logger';
import {QuantumTreeNode} from './providers/structurelib/quantumgate';
import {QCViewerManagerService} from './components/viewerlib/qcviewermanager';

const logger = getLogger('Commander');

export async function build() {
  const sourceFile = await qv.manager.updateSource();
  if (sourceFile === undefined) {
    logger.log('Cannot find quantum circuit to view.');
    return;
  }
  if (qv.manager.tmpDir === undefined) {
    throw new Error('Temporary folder not found');
  }
  const tmpDir = qv.manager.tmpDir;

  vscode.window
    .showInputBox({
      prompt: 'Please input the variable name of the quantum circuit.',
      value: 'qc',
    })
    .then((value) => {
      qv.compiler.build(sourceFile, tmpDir, value);
    });

  if (sourceFile === undefined) {
    logger.log('Cannot find quantum circuit to view.');
    return;
  }
}

export async function view(mode?: 'tab' | vscode.Uri) {
  const sourceFile = await qv.manager.updateSource();
  if (sourceFile === undefined) {
    logger.log('Cannot find quantum circuit to view.');
    return;
  }
  if (!qv.manager.buildFileFinish) {
    vscode.window.showWarningMessage(
      'Can not view quantum circuit before building.'
    );
    return;
  }
  
  await qv.semanticTreeViewer.computeTreeStructure();
  await qv.qubitTreeViewer.initNodeProvider();
  if (sourceFile === undefined) {
    logger.log('Cannot find quantum circuit to view.');
    return;
  }

  const configuration = vscode.workspace.getConfiguration('quantivine');
  const tabEditorGroup = configuration.get(
    'view.qcv.tab.editorGroup'
  ) as string;
  const viewer =
    typeof mode === 'string'
      ? mode
      : configuration.get<'tab'>('view.qcv.viewer', 'tab');
  if (viewer === 'tab') {
    return qv.viewer.openTab(sourceFile, tabEditorGroup, true);
  }
  return;
}

export async function edit(gate: QuantumTreeNode) {
  logger.log(`Edit: ${gate.label}`);
  qv.viewer.updateHighlight(gate.label);
}

export async function themeChange(theme: vscode.ColorTheme) {
  qv.viewer.updateTheme(theme);
}

export async function setMatrixComponentIndex(index: number) {
  const sourceFile = qv.manager.sourceFile;
  if (sourceFile !== undefined) {
    const panelSet = QCViewerManagerService.getPanelSet(sourceFile);
    panelSet?.forEach((panel) => {
      panel.setMatrixComponentIndex(index);
    });
  }
}
export async function setFocus(index: number) {
  const sourceFile = qv.manager.sourceFile;
  if (sourceFile !== undefined) {
    const panelSet = QCViewerManagerService.getPanelSet(sourceFile);
    panelSet?.forEach((panel) => {
      panel.setFocus(index);
    });
  }
}

export async function refreshView() {
  qv.viewer.refreshView();
}

export async function selectQubit(index: number) {
  const sourceFile = qv.manager.sourceFile;
  if (sourceFile !== undefined) {
    const panelSet = QCViewerManagerService.getPanelSet(sourceFile);
    panelSet?.forEach((panel) => {
      panel.setFocusQubit(index);
    });
  }
}
