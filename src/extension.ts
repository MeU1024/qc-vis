// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { VisPanel } from "./panels/VisPanel";
import { TestView } from "./testView";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  let currentPanel: vscode.WebviewPanel | undefined = undefined;
  console.log('Congratulations, your extension "qc-vis" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand("qc-vis.helloWorld", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    vscode.window.showInformationMessage("Hello World from qc-vis!");
    VisPanel.render(context.extensionUri);
    currentPanel = VisPanel.getCurrentPanel();
  });

  new TestView(context);
  vscode.commands.registerCommand("testView.editEntry", (node: any) => {
    if (!currentPanel) {
      vscode.window.showInformationMessage(
        `Successfully called edit entry on ${node.key}.`
      );
      return;
    }

    // Send a message to webview.
    // You can send any JSON serializable data.
    VisPanel.updateHighlight(node.key);

    VisPanel.getCurrentPanel()?.webview.postMessage({
      command: "test",
      text: node.key,
    });
    // panel.webview.html = getWebviewContent(node.key);
    // VisPanel.currentPanel.webview.html = getWebviewContent(node.key);

    // console.log(node);
  });

  context.subscriptions.push(disposable);
}

function getWebviewContent(index: number) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8"> 
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cat Coding</title>
</head>
<body>
    <div>${index}</div>
</body>
</html>`;
}
// This method is called when your extension is deactivated
export function deactivate() {}
