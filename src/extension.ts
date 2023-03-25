import * as vscode from "vscode";
import { getLogger } from "./components/logger";
import { QCViewerManagerService } from "./components/viewerlib/qcviewermanager";
import { AbstractionDataProvider } from "./providers/abstraction";
import { QuantumTreeNode } from "./providers/structurelib/quantumgate";
import * as qv from "./quantivine";

const logger = getLogger("Extension");

export function activate(context: vscode.ExtensionContext) {
  void vscode.commands.executeCommand("setContext", "quantivine:enabled", true);

  qv.init(context);

  qv.manager.updateSource();

  registerQuantivineCommands();

  registerProviders();
}

function registerQuantivineCommands() {
  qv.registerDisposable(
    vscode.commands.registerCommand("quantivine.build", () =>
      qv.commander.build()
    ),
    vscode.commands.registerCommand("quantivine.refreshView", () =>
      qv.commander.refreshView()
    ),
    vscode.commands.registerCommand(
      "quantivine.view",
      (mode: "tab" | vscode.Uri | undefined) => qv.commander.view(mode)
    )
  );
  qv.registerDisposable(
    vscode.commands.registerCommand(
      "quantivine.editEntry",
      (node: QuantumTreeNode) => qv.commander.edit(node)
    )
  );
  qv.registerDisposable(
    vscode.commands.registerCommand(
      "quantivine.showMatrix",
      (node: QuantumTreeNode) => {
        qv.commander.setMatrixComponentIndex(node.treeIndex);
        logger.log(node.treeIndex.toString());
      }
    )
  );
  qv.registerDisposable(
    vscode.commands.registerCommand(
      "quantivine.focus",
      (node: QuantumTreeNode) => {
        qv.commander.setFocus(node.treeIndex);
        // node.contextValue ='highlightcomponent'
        logger.log(node.treeIndex.toString());
      }
    )
  );
  qv.registerDisposable(
    vscode.window.onDidChangeActiveColorTheme(async (event) => {
      qv.commander.themeChange(event);
    })
  );
}

function registerProviders() {
  const configuration = vscode.workspace.getConfiguration("quantivine");
}
