# `src` Directory
This directory contains the core source code for Quantivine. Here is a breakdown of its structure:
```
└─src  		
  ├── components
  │  │   eventBus.ts       
  │  │   logger.ts       
  │  │   manager.ts     
  │  │   qvfs.ts        
  │  │   server.ts     
  │  │   treeview.ts	 
  │  │   viewer.ts	   
  │  └── viewerlib
  │         qcviewermanager.ts
  │         qcviewerpanel.ts     
  ├── panels
  │      VisPanel.ts	
  ├── providers
  │  │   abstraction.ts              
  │  │   component.ts                
  │  │   context.ts                  
  │  │   qubits.ts                   
  │  │   structure.ts                
  │  ├── abstractionlib
  │  │      abstractionrule.ts     
  │  └── structurelib
  │         dataloader.ts          
  │         layout.ts			
  │         qcmodel.ts             
  │         quantumgate.ts 
  ├── utilities
  │   commander.ts    			 
  │   extension.ts     		
  │   quantivine.ts   
```

Please note that the provided directory structure may vary as more features are added or the codebase evolves.