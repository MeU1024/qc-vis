import * as vscode from "vscode";
import * as qv from "./quantivine";
import { getLogger } from "./components/logger";
import { QuantumTreeNode } from "./providers/structurelib/quantumgate";

const logger = getLogger("Commander");

export async function build() {}

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
