import * as vscode from "vscode";
import * as qv from "./quantivine";
import { getLogger } from "./components/logger";
import { QuantumTreeNode } from "./providers/structurelib/quantumgate";
import { QCViewerManagerService } from "./components/viewerlib/qcviewermanager";
import { DataLoader } from "./providers/structurelib/dataloader";
import * as fs from 'fs'; 

const logger = getLogger("Commander");

export async function build() {
  const sourceFile = await qv.manager.updateSource();
  if(qv.manager.tmpDir == undefined){
    throw new Error("Temporary folder not found");
  }
  var tempDir = vscode.Uri.file(qv.manager.tmpDir);
  let structureDataFile = vscode.Uri.joinPath(tempDir, `${qv.manager.algorithm}_structure.json`) ;

  vscode.window.withProgress({  
    location: vscode.ProgressLocation.Window,  
    title: 'building...',  
    cancellable: false  
    }, (progress, token) => {  
      progress.report({ increment: 0 });  
      return new Promise<void>(resolve => { 
          const total = 100;  
          let completed = 0;  
          const timer = setInterval(() => {  
              if(fs.existsSync(structureDataFile.fsPath)) {
                progress.report({ increment: 100 });  
                completed += 100; 
              }
              if (completed >= total) {  
                  clearInterval(timer);  
                  resolve();  
              }  
          }, 1000);  
      });  
    });
  if (sourceFile === undefined) {
    logger.log("Cannot find quantum circuit to view.");
    return;
  }
  const tmpDir = qv.viewer.code2data(sourceFile);
}

export async function view(mode?: "tab" | vscode.Uri) {
  if (mode) {
    logger.log(`VIEW command invoked with mode: ${mode}.`);
  } else {
    logger.log("VIEW command invoked.");
  }
  if (!vscode.window.activeTextEditor) {
    logger.log("Cannot find active TextEditor.");
    return;
  }
  if (
    !qv.manager.hasQPLId(vscode.window.activeTextEditor.document.languageId)
  ) {
    logger.log("Active document is not a Quantum Program file.");
    return;
  }
  const sourceFile = await qv.manager.updateSource();
  await qv.semanticTreeViewer.computeTreeStructure();
  await qv.qubitTreeViewer.InitNodeProvider();
  if (sourceFile === undefined) {
    logger.log("Cannot find quantum circuit to view.");
    return;
  }

  const configuration = vscode.workspace.getConfiguration("quantivine");
  const tabEditorGroup = configuration.get(
    "view.qcv.tab.editorGroup"
  ) as string;
  const viewer =
    typeof mode === "string"
      ? mode
      : configuration.get<"tab">("view.qcv.viewer", "tab");
  if (viewer === "tab") {
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
