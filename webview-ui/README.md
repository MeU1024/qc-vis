# `webview-ui` Directory

This directory contains all of the code that will be executed within the webview context. It can be thought of as the place where all the "frontend" code of a webview is contained.

Types of content that can be contained here:

- Frontend framework code (i.e. React, Svelte, Vue, etc.)
- JavaScript files
- CSS files
- Assets / resources (i.e. images, illustrations, etc.)



```
└─src
├─components
│  ├─BitsName            qubit标识
│  ├─CircuitAnnotator    电路文字标注
│  ├─CircuitRender       电路渲染（canvas）
│  ├─GridDrawing         grid渲染
│  └─GridText            grid文字标注
├─containers
│  ├─ConnectivityPanel   矩阵视图
│  ├─DataFlowPanel       （x）
│  ├─DetailPanel         Abstraction
│  ├─OverviewPanel       主视图
│  ├─ParallelismPanel    并行空闲关系
│  ├─ParamPanel          （x）
│  └─ProvenancePanel
└─utilities
		Circuit2GridData.ts             将circuit数据转为grid-based数据
    extentRender.ts                 延长线的渲染（svg）
    HighlightBackgroundRender.ts    高亮背景色 (canvas)
    HighlightFrameRender.ts         高亮框 （canvas）
    svgCircuitRender.tsx            用于ParallelismPanel中电路图的渲染（svg）
```



当更改了前端内容之后请重新build