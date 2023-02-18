import * as vscode from "vscode";

export class TreeView {
  constructor(context: vscode.ExtensionContext) {
    const view = vscode.window.createTreeView("quantivine-treeview", {
      treeDataProvider: aNodeWithIdTreeDataProvider(),
      showCollapseAll: true,
    });
    context.subscriptions.push(view);
    vscode.commands.registerCommand("quantivine-treeview.reveal", async () => {
      const key = await vscode.window.showInputBox({
        placeHolder: "Type the label of the item to reveal",
      });
      if (key) {
        await view.reveal(
          { key },
          { focus: true, select: false, expand: true }
        );
      }
    });
    vscode.commands.registerCommand("quantivine-treeview.changeTitle", async () => {
      const title = await vscode.window.showInputBox({
        prompt: "Type the new title for the Test View",
        placeHolder: view.title,
      });
      if (title) {
        view.title = title;
      }
    });
  }
}

const tree: any = {
  root: ["QuantumCircuit1"],
  QuantumCircuit1: ["H-Gate", "G1", "G2", "G3", "G4", "G5"],
  G4: ["G41", "G42"],
};
const nodes: any = {};

function aNodeWithIdTreeDataProvider(): vscode.TreeDataProvider<{
  key: string;
}> {
  return {
    getChildren: (element: { key: string }): { key: string }[] => {
      return getChildren(element ? element.key : undefined).map((key) =>
        getNode(key)
      );
    },
    getTreeItem: (element: { key: string }): vscode.TreeItem => {
      const treeItem = getTreeItem(element.key);
      treeItem.id = element.key;
      return treeItem;
    },
    getParent: ({ key }: { key: string }): { key: string } | undefined => {
      const parentKey = key.substring(0, key.length - 1);
      return parentKey ? new Key(parentKey) : undefined;
    },
  };
}

function getChildren(key: string | undefined): string[] {
  if (!key) {
    return tree["root"];
  }
  const treeElement = getTreeElement(key);
  if (treeElement) {
    return treeElement;
  }
  return [];
}

function getTreeItem(key: string): vscode.TreeItem {
  const treeElement = getTreeElement(key);
  // An example of how to use codicons in a MarkdownString in a tree item tooltip.
  const tooltip = new vscode.MarkdownString(`$(zap) Tooltip for ${key}`, true);
  return {
    label: /**vscode.TreeItemLabel**/ <any>{
      label: key,
      //highlights: key.length > 1 ? [[key.length - 2, key.length - 1]] : void 0,
    },
    //id:"",
    tooltip,
    collapsibleState:
      treeElement && Object.keys(treeElement).length
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None,
  };
}

function getTreeElement(element: string): any {
  return tree[element];
}

function getNode(key: string): { key: string } {
  if (!nodes[key]) {
    nodes[key] = new Key(key);
  }
  return nodes[key];
}

class Key {
  constructor(readonly key: string) {}
}

export class Gate extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private readonly number: Number,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly command?: vscode.Command
  ) {
    super(label, collapsibleState);

    //this.tooltip = `${this.label}-${this.version}`;
    //this.description = this.version;
  }

  // iconPath = {
  // 	light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
  // 	dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  // };

  contextValue = "dependency";
}
