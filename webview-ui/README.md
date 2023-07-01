# `webview-ui` Directory

This directory contains all the code that will be executed within the webview context. It serves as the repository for the frontend code of the webview.

This directory includes the following content:

```
└─src  
  ├─components  
  │  ├─BitsName            - Qubit annotations  
  │  ├─CircuitAnnotator    - Circuit annotations  
  │  ├─CircuitRender       - Circuit rendering (canvas)  
  │  ├─GridDrawing         - Grid rendering  
  │  └─GridText            - Grid annotations  
  ├─containers  
  │  ├─ConnectivityPanel   - Connectivity View  
  │  ├─DataFlowPanel       - (Deprecated)  
  │  ├─DetailPanel         - Abstraction View  
  │  ├─OverviewPanel       - Component View  
  │  ├─ParallelismPanel    - Placement View  
  │  ├─ParamPanel          - (Deprecated)  
  │  └─ProvenancePanel     - Provenance View  
  └─utilities  
      Circuit2GridData.ts             - Converts circuit data to grid-based data  
      extentRender.ts                 - Renders extension lines (svg)  
      HighlightBackgroundRender.ts    - Renders highlight background (canvas)  
      HighlightFrameRender.ts         - Renders highlight frames (canvas)  
      svgCircuitRender.tsx            - Renders circuit diagrams for the ParallelismPanel (svg)  
```
Please ensure that you rebuild the project after making changes to the frontend content.
