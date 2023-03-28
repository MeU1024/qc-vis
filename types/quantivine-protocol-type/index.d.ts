export type PanelRequest =
  | {
      type: "initialized";
    }
  | {
      type: "keyboard_event";
      event: any;
    }
  | {
      type: "state";
      state: QCViewerState;
    }
  | {
      type: "focusGate";
      layer: number;
    }
  | {
      type: "qubitRangeStart";
      qubitRangeStart: number;
    }
  | {
      type: "layerRangeStart";
      layerRangeStart: number;
    }
  | {
      type: "focusQubit";
      focusQubit: number;
    };

export type QCViewerState = {
  kind?: "not_stored";
  path?: string;
  dataFileUri?: string;
};
