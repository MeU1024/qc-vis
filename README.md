# Quantivine: A Visualization Approach for Large-scale Quantum Circuit Representation and Analysis

Here is the official implementation of the system in paper ["Quantivine: A Visualization Approach for Large-scale Quantum Circuit Representation and Analysis"]().

![features](./images/features.png)

We implemented the system as an extension of Visual Studio Code, named **Quantivine**.

## Description
This is a system designed for visualizing scalable quantum circuits.

### Architecture
<img src="./images/system-overview.png" width = "50%" alt="system-overview" align=center/>

- **Code Processor**: The code of the quantum circuit is parsed by Python scripts. [`/scripts`]()
- **Data Processor & Controller**: The circuit data is processed in the backend, supported by *Node.js*. [`/src`]()
- **Visualizer**: The circuit is visualized in the frontend supported by *React.js*. [`/webview-ui`]()

### Features

- Component Segmentation
- Pattern Abstraction
- Context Enhancement

## Citation
```
@article{
  author    = {Zhen Wen and
               Yihan Liu and
               Siwei Tan and
               Jieyi Chen and
               Minfeng Zhu and
               Dongming Han and
               Jianwei Yin and
               Mingliang Xu and
               Wei Chen},
  title     = {Quantivine: A Visualization Approach for Large-scale Quantum Circuit Representation and Analysis},
  year      = {2023},
  doi       = {},
}
```

## install

change to the project root directory, then

`npm install && cd webview-ui && npm install`

and then 

`cd webview-ui && npm run build`

## Usage

You should make sure that your Python file can run in the Visual Studio Code workspace,  and  the corresponding environment is properly configured in the workspace’s Python interpreter.

click `Build QC` and Waiting for the Python script to finish running 

then click `View QC`

### change the target of the quantum circuit

( target means the circuit you want to display

```python
def carry(qc, c0, a, b, c1):
    qc.ccx(a, b, c1)
    qc.cx(a, b)
    qc.ccx(c0, b, c1)
```

take this code as an example, the target is `qc` )

in workspace

`Ctrl + Shift + P ` and choose `Preferences: Open User Settings` 

search `qctarget` （default value is `qc`）