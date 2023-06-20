```
│  commander.ts    			 
│  extension.ts     		
│  quantivine.ts    		
│
├─components
│  │  eventBus.ts       事件
│  │  logger.ts       
│  │  manager.ts     创建临时文件夹、调用python脚本对原始数据处理等
│  │  qvfs.ts        
│  │  server.ts     
│  │  treeview.ts	 
│  │  viewer.ts	   
│  │
│  └─viewerlib
│          qcviewermanager.ts
│          qcviewerpanel.ts     
│
├─panels
│      README.md
│      VisPanel.ts	
│
├─providers
│  │  abstraction.ts              abs数据的生成计算
│  │  component.ts                component电路数据的生成计算
│  │  context.ts                  context数据的生成计算（矩阵、provenance、并行空闲）
│  │  qubits.ts                   
│  │  structure.ts                树结构视图
│  │
│  ├─abstractionlib
│  │      abstractionrule.ts     抽象模式的定义、类
│  │
│  └─structurelib
│          dataloader.ts          原始电路数据&structure载入, 中间数据（json）的路径定义获取
│          layout.ts			
│          qcmodel.ts             
│          quantumgate.ts         树节点类型
│
└─utilities
```

