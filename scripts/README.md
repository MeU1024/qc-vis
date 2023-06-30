## Features of Semantic Analysis Kernel

This is responsible for the semantic analysis of quantum circuits (implemented for [Qiskit](https://qiskit.org/) code).

The parser receives source code with a target circuit, and generates its structure, constructions (qubits and quantum gates), and latent semantics.

**Legend**

    ✅ - Feature implemented
    🔄 - Feature partially implemented
    ❌ - Feature not supported

## Supported Features
* ✅ Semantic analysis of quantum circuits (single-file code written in Qiskit)
* ✅ Support of 27 basic quantum gates：

  ```python
  supported_gate_list = [
      "x", "y", "z", "h", "s", "sdg", "t", "tdg", "rx", "ry", "rz", "u", "p",
      "i", "id", "cx", "cy", "cz", "ch", "cry", "crz", "cp", "cu", "swap", "ccx",
      "cswap", "ryy"
  ]
  ```
* ✅ User-defined functions

## Unsupported Features

* ❌ `ClassicalRegister` and `Measurement`.
* ❌ If statement wrapped quantum gates, e.g., `if i == n: qc.h(i)`
* ❌ Expression in `return` statements, e.g., `return construct_full_qaoa(5, [.4], [.8], range(n), E)`
* 🔄 Methods / functions of Qiskit beyond basic quantum gates
* 🔄 Passing array in args of qubit,e.g., `qc.h(range(len(V)))`
* 🔄 Class based circuit
* 递归或函数互相调用
* 函数参数 *args 和 **kwargs 写法 (resolved)
* 函数嵌套定义：函数内定义函数
