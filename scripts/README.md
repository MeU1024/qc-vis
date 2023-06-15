## 支持的功能

* 单文件内基于 qiskit 的量子电路语法分析
* 支持 25 种基本的量子门：

  ```python
  supported_gate_list = [
      "x", "y", "z", "h", "s", "sdg", "t", "tdg", "rx", "ry", "rz", "u", "p",
      "i", "id", "cx", "cy", "cz", "ch", "crz", "cp", "cu", "swap", "ccx",
      "cswap"
  ]
  ```
* 支持自定义函数

## 不支持的语法

* qiskit 中除量子门外的其它函数/方法
* 与量子门相关的 if 语句
* 类
* 函数参数 *args 和 **kwargs 写法
* 量子门 qubit 参数传入数组
* 函数嵌套定义：函数内定义函数
* return 语句不支持返回表达式，如：

  ```python
  return construct_full_qaoa(5, [.4], [.8], range(n), E)
  ```
