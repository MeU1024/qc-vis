import { commands, ExtensionContext } from "vscode";
import { VisPanel } from "./panels/VisPanel";
import { TestView } from "./testView";

export function activate(context: ExtensionContext) {
  // Create the show hello world command
  const showVisCommand = commands.registerCommand("qc-vis.helloWorld", () => {
    VisPanel.render(context.extensionUri);
  });

  new TestView(context);
  commands.registerCommand("testView.editEntry", (node: any) => {
    // Send a message to webview.
    // You can send any JSON serializable data.
    VisPanel.updateHighlight(node.key);
  });

  // Add command to the extension context
  context.subscriptions.push(showVisCommand);
}
