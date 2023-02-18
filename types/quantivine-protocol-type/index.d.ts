export type PanelRequest = {
    type: 'initialized'
} | {
    type: 'keyboard_event',
    event: any
} | {
    type: 'state',
    state: QCViewerState
}

export type QCViewerState = {
    kind?: 'not_stored',
    path?: string,
    dataFileUri?: string,
}
