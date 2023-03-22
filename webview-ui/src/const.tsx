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
  single_gate_middle_empty_bg: 31,
};

// export const
export const opList = Object.keys(opDict);
export const WIRE_STROKE = "#6FD7F3";
export const SINGLE_GATE_STROKE = "#4886E4";
export const MULTI_GATE_STROKE = "#E44898";
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
export const opTypeDict: { [key: string]: string } = {
  x: "single",

  rx: "single",
  ry: "single",
  rz: "single",
  h: "single",
  p: "single",
  cp: "multi",
  cx: "multi",
  cy: "multi",
  cz: "multi",
  cry: "multi",
  ccx: "triple",

  ryy: "double",
  csw: "triple",
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

export const colorGroup = ["#ebf1f4", "#7ac943", "#ff7bac"];
