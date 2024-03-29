export const STROKE_STYLE = "#a4a4a4";
export const FILL_STYLE = "#a4a4a4";
export const LINE_WIDTH = 1;
export const BOLD_LINE_WIDTH = 1.5;
export const opDict = {
  horizon_line: 0,
  single_gate: 1,
  single_gate_middle: 2,
  single_gate_bottom: 3,
  single_gate_up: 4,
  empty: 5,
  dots: 6,
  ctrl_up: 7,
  vertical_line: 8,
  ctrl_down: 9,
  cx_up: 10,
  cx_down: 11,
  multi_gate_left_up: 12,
  multi_gate_right_up: 13,
  multi_gate_left_bottom: 14,
  multi_gate_right_bottom: 15,
  multi_gate_left: 16,
  multi_gate_right: 17,
  multi_gate_bottom: 18,
  multi_gate_up: 19,
  custom_gate: 20,
  cy_down: 21,
  cy_up: 22,
  ryy_gate_up: 23,
  ryy_gate_bottom: 24,
  swap_middle: 25,
  swap_up: 26,
  swap_down: 27,
  custom_ctrl_up: 28,
  vertical_line_empty_bg: 29,
  ctrl_middle: 30,
  single_gate_up_empty_bg: 31,
  single_gate_middle_empty_bg: 32,
  single_gate_bottom_empty_bg: 33,
  custom_ctrl_bottom: 34,
  custom_vertical_line: 35,
  custom_vertical_line_empty_bg: 36,
  single_gate_ctrl_bottom_empty_bg: 37,
  single_gate_ctrl_bottom: 38,
};

// export const
export const opList = Object.keys(opDict);
export const WIRE_STROKE = "#6FD7F3";
// export const WIRE_STROKE = "#000000";
export const SINGLE_GATE_STROKE = "#4886E4";
export const MULTI_GATE_STROKE = "#E44898";
export const TRIPLE_GATE_STROKE = "#E44898";
export const CUSTOM_GATE_STROKE = "#9FA3A5";
export const SELECTION_BG = "#CCCCCC";
export const MATRIX_BG = "#6FD7F3";
export const MATRIX_STROKE = "#EBF1F4";
export const GATE_FILL = "#FFFFFF";
export const PARA_HIGH_FILL = "#FF1D25";
export const PARA_LOW_FILL = "#3FA9F5";
export const IDLE_FILL = "#BDCCD4";
export const IDLE_STROKE = "#D4D4D4";
export const GATE_FILL_OPACITY = "80%";
export const HIGHLIGHT_FRAME_FILL = "rgba(204,204,204,0.1)";
export const HIGHLIGHT_FRAME = "#4234C6";
// export const HIGHLIGHT_FRAME = "#4234C6";
// 2C2060
export const HIGHLIGHT_GATE_BG = "white";
export const opTypeDict: { [key: string]: string } = {
  x: "single",
  y: "single",
  z: "single",
  h: "single",
  s: "single",
  sdg: "single",
  t: "single",
  tdg: "single",
  rx: "single",
  ry: "single",
  rz: "single",
  u: "single",
  p: "single",
  i: "single",
  id: "single",

  cx: "multi",
  cy: "multi",
  cry: "multi",
  crz: "multi",
  ch: "multi",
  cu: "multi",

  cz: "multi",
  cp: "multi",
  swap: "multi",
  
  ryy: "double",

  cswap: "triple",
  ccx: "triple",
};
export const colorDict: { [key: string]: string } = {
  single: SINGLE_GATE_STROKE,
  customized: CUSTOM_GATE_STROKE,
  target: MULTI_GATE_STROKE,
  control: MULTI_GATE_STROKE,
  multi: MULTI_GATE_STROKE,
  double: MULTI_GATE_STROKE,
  triple: MULTI_GATE_STROKE,
};

export const colorGroup = ["#ebf1f4", "#7ac943", "#ff7bac",
  "#6FD7F3", "#FF0000", "#00FF00", "#0000FF", "#FFFF00",
  "#00FFFF", "#FF00FF", "#C0C0C0", "#808080", "#800000",
  "#808000", "#008000", "#800080", "#008080", "#000080",
  "#FFA500", "#FFC0CB", "#FFB6C1", "#FF69B4", "#FF1493",
  "#C71585", "#DB7093", "#FF4500", "#FF6347", "#FF7F50",
  "#FF8C00", "#FFA07A", "#FFD700", "#FFFFE0", "#FFFACD",
  "#FAFAD2", "#FFEFD5", "#FFE4B5", "#FFDAB9", "#EEE8AA",
  "#F0E68C", "#BDB76B", "#00FF7F", "#7CFC00", "#7FFF00",
  "#ADFF2F", "#32CD32", "#98FB98", "#90EE90", "#00FA9A"];
