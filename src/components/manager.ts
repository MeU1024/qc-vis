import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as tmp from 'tmp';
import * as qv from '../quantivine';
import * as eventbus from './eventBus';
import {getLogger} from './logger';

const logger = getLogger('Manager');

export class Manager {
  private _sourceFileLanguageId: string | undefined;
  private _sourceFile: vscode.Uri | undefined;
  private _tmpDir: string | undefined;
  private _algorithm: string | undefined;
  private _buildFileFinish: boolean;

  get buildFileFinish() {
    return this._buildFileFinish;
  }

  constructor() {
    this.registerSetEnvVar();
    this.createTempFolder();

    this._buildFileFinish = false;
    qv.registerDisposable(
      vscode.window.onDidChangeActiveTextEditor(
        async (e: vscode.TextEditor | undefined) => {
          this.updateSource();
        }
      ),
      // TODO: This event is not triggered.
      qv.eventBus.on(eventbus.FileChanged, () => {
        this._buildFileFinish = false;
      }), 
      qv.eventBus.on(eventbus.SourceFileChanged, () => {
        this._buildFileFinish = false;
      }),
      qv.eventBus.on(eventbus.CodeBuilt, () => {
        this._buildFileFinish = true;
      }),
    );
  }

  createTempFolder() {
    // Create temp folder
    tmp.setGracefulCleanup();
    try {
      this._tmpDir = tmp
        .dirSync({unsafeCleanup: true})
        .name.split(path.sep)
        .join('/');
      console.log('Create temp folder:', this._tmpDir);
    } catch (error) {
      void vscode.window.showErrorMessage(
        'Error during making tmpdir to build quantum circuit files. Please check the environment variables, TEMP, TMP, and TMPDIR on your system.'
      );
      console.log(
        `TEMP, TMP, and TMPDIR: ${JSON.stringify([
          process.env.TEMP,
          process.env.TMP,
          process.env.TMPDIR,
        ])}`
      );

      // The library does not work well with single quotes. Please don't use ' in your user name.
      if (/['"]/.exec(os.tmpdir())) {
        const msg = `The path of tmpdir cannot include single quotes and double quotes: ${os.tmpdir()}`;
        void vscode.window.showErrorMessage(msg);
        console.log(msg);
      }
      throw error;
    }
  }

  get tmpDir() {
    return this._tmpDir;
  }

  get sourceFileLanguageId() {
    return this._sourceFileLanguageId;
  }

  set sourceFileLanguageId(id: string | undefined) {
    this._sourceFileLanguageId = id;
  }

  get sourceFile() {
    return this._sourceFile;
  }

  set sourceFile(file: vscode.Uri | undefined) {
    this._sourceFile = file;
  }

  get algorithm() {
    return this._algorithm;
  }

  /**
   * Set the current editing file as the source file.
   */
  async updateSource(): Promise<vscode.Uri | undefined> {
    const wsfolders = vscode.workspace.workspaceFolders?.map((e) =>
      e.uri.toString(true)
    );
    logger.log(`Current workspace folders: ${JSON.stringify(wsfolders)}`);

    const currentFile = vscode.window.activeTextEditor?.document.uri;
    logger.log(`Current active editor: ${currentFile}`);

    if (!currentFile) {
      return;
    }

    const filename = path.basename(currentFile.fsPath);

    if (this.sourceFile !== currentFile) {
      logger.log(
        `Source file changed: from ${this.sourceFile} to ${currentFile}`
      );
      this.sourceFile = currentFile;
      this._algorithm = filename.substring(0, filename.lastIndexOf('.'));
      qv.eventBus.fire(eventbus.SourceFileChanged, currentFile.fsPath);
    }

    // const laguangeId = this.inferLanguageId(currentFile);

    // if (this.sourceFile !== currentFile && this.hasQPLId(laguangeId)) {
    //   logger.log(
    //     `Source file changed: from ${this.sourceFile} to ${currentFile}`
    //   );

    //   this.sourceFile = currentFile;

    //   this.sourceFileLanguageId = laguangeId;
    //   logger.log(`Source file languageId: ${laguangeId}`);
    //   // void qv.semanticTreeViewer.computeTreeStructure();
    //   qv.eventBus.fire(eventbus.SourceFileChanged, currentFile.fsPath);
    // } else {
    //   logger.log(`Keep using the same source file: ${this.sourceFile}`);
    //   // void qv.semanticTreeViewer.refreshView();
    // }

    return this.sourceFile;
  }

  supportAlgorithm(filename: string) {
    let algName = filename.substring(0, filename.lastIndexOf('.'));
    return qv.supportedAlgorithms.includes(algName);
  }

  private inferLanguageId(filename: vscode.Uri): string | undefined {
    const ext = path.extname(filename.fsPath).toLocaleLowerCase();
    if (ext === '.py') {
      return 'python';
    }
    return;
  }

  /**
   * Returns `true` if the language of `id` is one of supported languages.
   *
   * @param id The language identifier
   */
  hasQPLId(id: string | undefined) {
    return id ? ['python'].includes(id) : false;
  }

  private registerSetEnvVar() {
    const setEnvVar = () => {
      const configuration = vscode.workspace.getConfiguration('quantivine');
      const dockerImageName: string = configuration.get(
        'docker.image.quantivine',
        ''
      );
      logger.log(
        `Set $QUANTIVINE_DOCKER_PYTHON: ${JSON.stringify(dockerImageName)}`
      );
      process.env['QUANTIVINE_DOCKER_PYTHON'] = dockerImageName;
    };
    setEnvVar();

    vscode.workspace.onDidChangeConfiguration((ev) => {
      if (ev.affectsConfiguration('quantivine.docker.image.python')) {
        setEnvVar();
      }
    });
  }
}
