import * as vscode from "vscode";
import * as path from "path";
import * as qv from "../../quantivine";
import { ViewerStatusChanged } from "../eventbus";

import { getLogger } from "../logger";
import {
  PanelRequest,
  QCViewerState,
} from "../../../types/quantivine-protocol-type";
import { getUri } from "../../utilities/getUri";
import { getNonce } from "../../utilities/getNonce";
import { AbstractionDataProvider } from "../../providers/abstraction";
import { ComponentDataProvider } from "../../providers/component";

const logger = getLogger("Viewer", "Panel");

export class QCViewerPanel {
  readonly webviewPanel: vscode.WebviewPanel;
  readonly dataFileUri: vscode.Uri;
  private viewerState: QCViewerState | undefined;
  private _abstractionData: AbstractionDataProvider | undefined;
  private _componentData: ComponentDataProvider | undefined;

  constructor(dataFileUri: vscode.Uri, panel: vscode.WebviewPanel) {
    this.dataFileUri = dataFileUri;
    this.webviewPanel = panel;
    panel.webview.onDidReceiveMessage((msg: PanelRequest) => {
      switch (msg.type) {
        case "state": {
          this.viewerState = msg.state;
          qv.eventBus.fire(ViewerStatusChanged, msg.state);
          break;
        }
        default: {
          break;
        }
      }
    });
  }

  get state() {
    return this.viewerState;
  }

  postMessage(message: any) {
    this.webviewPanel.webview.postMessage(message);
  }

  updateData() {
    if (!this._componentData) {
      this._componentData = new ComponentDataProvider(this.dataFileUri);
    }
    if (!this._abstractionData) {
      this._abstractionData = new AbstractionDataProvider(this.dataFileUri);
    }
    this._componentData.updateData();
    this._abstractionData.updateData();
  }
}

export class QCViewerPanelService {
  private static alreadyOpened = false;

  static async createQCircuitViewerPanel(
    dataUri: vscode.Uri,
    preserveFocus: boolean
  ): Promise<QCViewerPanel> {
    // await qv.server.serverStarted;
    const panel = vscode.window.createWebviewPanel(
      "quantivine-vis",
      "Quantivine",
      {
        viewColumn: vscode.ViewColumn.Active,
        preserveFocus,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        // localResourceRoots: [
        //     vscode.Uri.joinPath(extensionUri, "out"),
        //     vscode.Uri.joinPath(extensionUri, "webview-ui/build"),
        //   ],
      }
    );
    const extensionUri = qv.getExtensionUri();
    const htmlContent = await this.getQCircuitViewerContent(
      dataUri,
      panel.webview,
      extensionUri
    );
    panel.webview.html = htmlContent;
    const qcvPanel = new QCViewerPanel(dataUri, panel);
    return qcvPanel;
  }

  static async getQCircuitViewerContent(
    dataUri: vscode.Uri,
    webview: vscode.Webview,
    extensionUri: vscode.Uri
  ): Promise<string> {
    // The CSS file from the React build output
    const stylesUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.css",
    ]);
    // The JS file from the React build output
    const scriptUri = getUri(webview, extensionUri, [
      "webview-ui",
      "build",
      "assets",
      "index.js",
    ]);

    const nonce = getNonce();

    // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Hello World</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
