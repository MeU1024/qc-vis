import * as vscode from 'vscode';
import { NodeType, QuantumTreeNode } from './structurelib/quantumgate';
import * as qv from '../quantivine';
import * as fs from 'fs';  

import { getLogger } from '../components/logger';
import {
  SourceFileChanged,
  StructureUpdated as StructureUpdated,
} from '../components/eventBus';
import { ComponentGate, QcStructure } from './structurelib/qcmodel';
import { DataLoader } from './structurelib/dataloader';

const logger = getLogger('DataProvider', 'Structure');

export class GateNodeProvider
  implements vscode.TreeDataProvider<QuantumTreeNode>
{
  getNearestNode(gate: ComponentGate): QuantumTreeNode {
    let ret = this._nodeMap.get(gate.treeIndex);
    const r = NodeType.repetition;

    if (!ret) {
      return this.ds[0];
    }

    let parent = ret.parent;

    while (parent) {
      if (
        parent.type !== NodeType.repetition &&
        !this.isExpanded(parent.treeIndex)
      ) {
        ret = parent;
      }
      parent = parent.parent;
    }

    return ret;
  }
  private readonly _onDidChangeTreeData: vscode.EventEmitter<
    QuantumTreeNode | undefined
  > = new vscode.EventEmitter<QuantumTreeNode | undefined>();
  readonly onDidChangeTreeData: vscode.Event<QuantumTreeNode | undefined>;

  public ds: QuantumTreeNode[] = [];
  private cachedGates: QuantumTreeNode[] | undefined = undefined;
  private _nodeMap: Map<number, QuantumTreeNode> = new Map<
    number,
    QuantumTreeNode
  >();
  private _statMap: Map<number, vscode.TreeItemCollapsibleState> = new Map<
    number,
    vscode.TreeItemCollapsibleState
  >();
  private _focusPath: string[] | undefined;
  private _focusNode: QuantumTreeNode | undefined;

  constructor() {
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  /**
   * Return the components of the quantum circuit in the source file
   *
   * @param force If `false` and some cached data exists for the corresponding file, use it. If `true`, always recompute the structure from disk
   */
  async build(force: boolean): Promise<QuantumTreeNode[]> {

    
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

    if (qv.manager.sourceFile) {
      if (force || !this.cachedGates) {
        //TODO: file
        if (qv.manager.algorithm == undefined) {
          throw new Error("Algorithm undefined");
        }
        let dataloader = new DataLoader(qv.manager.algorithm);
        const structureFile = dataloader.structureDataFile;
        if(structureFile == undefined) {
          throw new Error("structureFile not found");
        }
        await readFileIfExists(structureFile.fsPath);
        this.cachedGates = await QcStructure.buildQcModel(structureFile);
      }
      this.ds = this.cachedGates;
      this.ds.forEach((gate) => this._updateTreeMap(gate));
      logger.log(
        `Structure ${force ? 'force ' : ''}updated with ${this.ds.length} for ${qv.manager.sourceFile
        } .`
      );
    } else {
      this.ds = [];
      this._clearTreeMap();
      logger.log('Structure cleared on undefined source file.');
    }
    return this.ds;
  }


  private _updateTreeMap(node: QuantumTreeNode) {
    console.log("_updateTreeMap??");
    this._nodeMap.set(node.treeIndex, node);
    this._statMap.set(node.treeIndex, node.collapsibleState);
    node.children.forEach((child) => this._updateTreeMap(child));
  }

  private _clearTreeMap() {
    this._nodeMap.clear();
    this._statMap.clear();
  }

  async update(force: boolean) {
    this.ds = await this.build(force);
    this._onDidChangeTreeData.fire(undefined);
    qv.eventBus.fire(StructureUpdated);
  }

  expand(treeIndex: number) {
    this._statMap.set(treeIndex, vscode.TreeItemCollapsibleState.Expanded);
  }

  collapse(treeIndex: number) {
    this._statMap.set(treeIndex, vscode.TreeItemCollapsibleState.Collapsed);
  }

  focusOn(selection: readonly (QuantumTreeNode | undefined)[]) {
    if (selection.length === 0) {
      this._focusNode = undefined;
      this._focusPath = undefined;
      return;
    }
    if (selection.length === 1) {
      const node = selection[0];
      this._focusNode = node;
      this._focusPath = this._getPath(node);
    } else {
      throw new Error('Method not implemented.');
    }
  }
  private _getPath(node: QuantumTreeNode | undefined): string[] | undefined {
    if (node === undefined) {
      return;
    }
    let ret = [node.label];
    while (node.parent) {
      node = node.parent;
      ret.push(node.label);
    }
    return ret;
  }
  getTreeItem(element: QuantumTreeNode): vscode.TreeItem {
    const collapsibleState = element.collapsibleState;

    const treeItem: vscode.TreeItem = new vscode.TreeItem(
      element.label,
      collapsibleState
    );

    // treeItem.command = {
    //   command: 'quantivine.goto-gate',
    //   title: '',
    //   arguments: [element.fileName, element.lineNumber],
    // };

    treeItem.tooltip = `GateType: ${element.type}`;
    if (element.type === NodeType.repetition) {
      treeItem.description = element.description;
    }
    treeItem.contextValue = element.type === 0 ? 'component' : '';

    return treeItem;
  }

  getChildren(
    element?: QuantumTreeNode
  ): vscode.ProviderResult<QuantumTreeNode[]> {
    if (qv.manager.sourceFile === undefined) {
      return [];
    }

    if (!element) {
      return this.build(false);
    }

    return element.children;
  }

  getParent(element?: QuantumTreeNode): QuantumTreeNode | undefined {
    if (qv.manager.sourceFile === undefined || !element) {
      return;
    }
    return element.parent;
  }

  isVisible(treeIndex: number): boolean {
    if(this._nodeMap.size <= 0) {
      qv.semanticTreeViewer.computeTreeStructure();
      qv.qubitTreeViewer.InitNodeProvider();
    }
    
    let node = this._nodeMap.get(treeIndex);

    if (node === undefined) {
      console.log("structure treeindex", treeIndex);
      throw new Error('Gate not found');
    }

    while (node.parent) {
      node = node.parent;
      if (
        this._statMap.get(node.treeIndex) ===
        vscode.TreeItemCollapsibleState.Collapsed
      ) {
        return false;
      }
    }

    return true;
  }

  isExpanded(treeIndex: number): boolean {
    return (
      this._statMap.get(treeIndex) === vscode.TreeItemCollapsibleState.Expanded
    );
  }

  getNodeByTreeIndex(treeIndex: number): QuantumTreeNode | undefined {
    return this._nodeMap.get(treeIndex);
  }

  logTree(node: QuantumTreeNode | undefined) {
    if (node) {
      logger.log(`${node.label} ${this._statMap.get(node.treeIndex)}`);
      node.children.forEach((child) => this.logTree(child));
    } else {
      this.ds.forEach((child) => this.logTree(child));
    }
  }

  get focusNode() {
    return this._focusNode;
  }

  get focusPath() {
    return this._focusPath;
  }
}

export class SemanticTreeViewer {
  private readonly _viewer: vscode.TreeView<QuantumTreeNode | undefined>;
  private readonly _treeDataProvider: GateNodeProvider;
  private _followCursor: boolean = true;

  constructor() {
    this._treeDataProvider = new GateNodeProvider();
    this._viewer = vscode.window.createTreeView('quantivine-treeview', {
      treeDataProvider: this._treeDataProvider,
      showCollapseAll: true,
    });
    // vscode.commands.registerCommand(
    //   'quantivine.structure-toggle-follow-cursor',
    //   () => {
    //     this._followCursor = !this._followCursor;
    //     logger.log(`Follow cursor is set to ${this._followCursor}.`);
    //   }
    // );
    // qv.registerDisposable(
    //   qv.eventBus.on(SourceFileChanged, (e) => {
    //     void qv.semanticTreeViewer.computeTreeStructure();
    //   })
    // );

    qv.registerDisposable(
      this._viewer.onDidCollapseElement((e) => {
        if (e.element) {
          // logger.log(`Collapsed ${e.element.label}`);
          this._treeDataProvider.collapse(e.element.treeIndex);
        }
      })
    );

    qv.registerDisposable(
      this._viewer.onDidExpandElement((e) => {
        if (e.element) {
          // logger.log(`Expanded ${e.element.label}`);
          this._treeDataProvider.expand(e.element.treeIndex);
        }
      })
    );

    qv.registerDisposable(
      this._viewer.onDidChangeSelection((e) => {
        if (e.selection) {
          logger.log(`Select ${e.selection[0]?.label}`);
          this._treeDataProvider.focusOn(e.selection);
        }
      })
    );
  }

  getNearestNode(gate: ComponentGate): QuantumTreeNode {
    return this._treeDataProvider.getNearestNode(gate);
  }

  getNodeByTreeIndex(treeIndex: number): QuantumTreeNode | undefined {
    return this._treeDataProvider.getNodeByTreeIndex(treeIndex);
  }

  /**
   * Recompute the whole structure from file and update the view
   */
  async computeTreeStructure() {
    await this._treeDataProvider.update(true);
  }

  /**
   * Refresh the view using cache
   */
  async refreshView() {
    await this._treeDataProvider.update(false);
  }

  /**
   * Check if the node is visible in the tree view.
   * A node is visible if all its parents are expanded.
   * @param treeIndex
   * @returns
   */
  isVisible(treeIndex: number): boolean {
    return this._treeDataProvider.isVisible(treeIndex);
  }

  isExpanded(treeIndex: number): boolean {
    return this._treeDataProvider.isExpanded(treeIndex);
  }

  logTreeData() {
    this._treeDataProvider.logTree(undefined);
  }

  get focusPath() {
    return this._treeDataProvider.focusPath;
  }

  get data() {
    return this._treeDataProvider;
  }
}
