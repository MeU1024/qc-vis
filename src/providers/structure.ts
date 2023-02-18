import * as vscode from 'vscode';
import {QuantumGate} from './structurelib/quantumgate';
import * as qv from '../quantivine';

import {getLogger} from '../components/logger';
import {
  SourceFileChanged,
  StructureUpdated as StructureUpdated,
} from '../components/eventBus';
import {QcStructure} from './structurelib/qcmodel';

const logger = getLogger('Structure');

export class GateNodeProvider implements vscode.TreeDataProvider<QuantumGate> {
  private readonly _onDidChangeTreeData: vscode.EventEmitter<
    QuantumGate | undefined
  > = new vscode.EventEmitter<QuantumGate | undefined>();
  readonly onDidChangeTreeData: vscode.Event<QuantumGate | undefined>;

  public ds: QuantumGate[] = [];
  private cachedGates: QuantumGate[] | undefined = undefined;

  constructor() {
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  /**
   * Return the components of the quantum circuit in the source file
   *
   * @param force If `false` and some cached data exists for the corresponding file, use it. If `true`, always recompute the structure from disk
   */
  async build(force: boolean): Promise<QuantumGate[]> {
    if (qv.manager.sourceFile) {
      if (force || !this.cachedGates) {
        this.cachedGates = await QcStructure.buildQcModel();
      }
      this.ds = this.cachedGates;
      logger.log(
        `Structure ${force ? 'force ' : ''}updated with ${this.ds.length} for ${
          qv.manager.sourceFile
        } .`
      );
    } else {
      this.ds = [];
      logger.log('Structure cleared on undefined source file.');
    }
    return this.ds;
  }

  async update(force: boolean) {
    this.ds = await this.build(force);
    this._onDidChangeTreeData.fire(undefined);
    qv.eventBus.fire(StructureUpdated);
  }

  getTreeItem(element: QuantumGate): vscode.TreeItem {
    const hasChildren = element.children.length > 0;
    const treeItem: vscode.TreeItem = new vscode.TreeItem(
      element.label,
      hasChildren
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.None
    );

    // treeItem.command = {
    //   command: 'quantivine.goto-gate',
    //   title: '',
    //   arguments: [element.fileName, element.lineNumber],
    // };

    treeItem.tooltip = `GateType: ${element.type}`;

    return treeItem;
  }

  getChildren(element?: QuantumGate): vscode.ProviderResult<QuantumGate[]> {
    if (qv.manager.sourceFile === undefined) {
      return [];
    }

    if (!element) {
      return this.build(false);
    }

    return element.children;
  }

  getParent(element?: QuantumGate): QuantumGate | undefined {
    if (qv.manager.sourceFile === undefined || !element) {
      return;
    }
    return element.parent;
  }
}

export class SemanticTreeViewer {
  private readonly _viewer: vscode.TreeView<QuantumGate | undefined>;
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
    qv.registerDisposable(
      qv.eventBus.on(SourceFileChanged, (e) => {
        void qv.semanticTreeViewer.computeTreeStructure();
      })
    );
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
}
