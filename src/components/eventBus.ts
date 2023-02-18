import {EventEmitter} from 'events';
import type {QCViewerState} from '../../types/quantivine-protocol-type';
import type {Disposable} from 'vscode';

export const BuildDone = 'BUILD_DONE';
export const AutoBuildInitiated = 'AUTO_BUILD_INITIATED';
export const SourceFileChanged = 'SOURCE_FILE_CHANGED';
export const FileParsed = 'FILE_PARSED';
export const ViewerPageLoaded = 'VIEWER_PAGE_LOADED';
export const ViewerStatusChanged = 'VIEWER_STATUS_CHANGED';
export const FileWatched = 'FILE_WATCHED';
export const FileChanged = 'FILE_CHANGED';
export const FileRemoved = 'FILE_REMOVED';
export const DocumentChanged = 'DOCUMENT_CHANGED';
export const StructureUpdated = 'STRUCTURE_UPDATED';
export const AutoCleaned = 'AUTO_CLEANED';

export type EventArgs = {
  [AutoBuildInitiated]: {type: 'onChange' | 'onSave'; file: string};
  [SourceFileChanged]: string;
  [FileParsed]: string;
  [ViewerStatusChanged]: QCViewerState;
  [FileWatched]: string;
  [FileChanged]: string;
  [FileRemoved]: string;
};

export type EventName =
  | typeof BuildDone
  | typeof AutoBuildInitiated
  | typeof SourceFileChanged
  | typeof ViewerPageLoaded
  | typeof FileParsed
  | typeof ViewerStatusChanged
  | typeof FileWatched
  | typeof FileChanged
  | typeof FileRemoved
  | typeof DocumentChanged
  | typeof StructureUpdated
  | typeof AutoCleaned;

export class EventBus {
  private readonly eventEmitter = new EventEmitter();

  dispose() {
    this.eventEmitter.removeAllListeners();
  }

  fire<T extends keyof EventArgs>(eventName: T, arg: EventArgs[T]): void;
  fire(eventName: EventName): void;
  fire(eventName: EventName, arg?: any): void {
    this.eventEmitter.emit(eventName, arg);
  }

  on(eventName: EventName, cb: (arg?: any) => void): Disposable {
    this.eventEmitter.on(eventName, cb);
    const disposable = {
      dispose: () => {
        this.eventEmitter.removeListener(eventName, cb);
      },
    };
    return disposable;
  }
}
