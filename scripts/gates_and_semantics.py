import ast
from unparse import Unparser
from io import StringIO
from public import get_target_arg_pos, get_target_keyword, supported_gate_list
import json


def get_qubit_from_ast_node(node):
    redirect = StringIO()
    Unparser(node, redirect)
    return redirect.getvalue()


# 根据 keyword 或 position 获取 qubit 参数
# 暂不支持数组输入
def get_qubits_by_keyword_or_position(caller, keys, positions):
    if type(caller) != ast.Call or type(caller.func) != ast.Attribute:
        return []
    index = []
    for keyword in caller.keywords:
        if keyword.arg in keys:
            index.append(get_qubit_from_ast_node(keyword.value))
    if len(index) == 0:
        for position in positions:
            index.append(get_qubit_from_ast_node(caller.args[position]))
    return index


# 获取各种门的 qubit 参数
def get_qubits(caller):
    if type(caller) != ast.Call or type(caller.func) != ast.Attribute:
        return []
    gate = caller.func.attr
    index = []
    if gate == "u":
        index = get_qubits_by_keyword_or_position(caller, ["qubit"], [3])
    elif gate in ["p", "rx", "ry", "rz"]:
        index = get_qubits_by_keyword_or_position(caller, ["qubit"], [1])
    elif gate in ["i", "id", "x", "y", "z", "h", "s", "sdg", "t", "tdg"]:
        index = get_qubits_by_keyword_or_position(caller, ["qubit"], [0])
    elif gate in ["cx", "cy", "cz", "ch"]:
        index = get_qubits_by_keyword_or_position(
            caller, ["control_qubit", "target_qubit"], [0, 1])
    elif gate in ["crz", "cp"]:
        index = get_qubits_by_keyword_or_position(
            caller, ["control_qubit", "target_qubit"], [1, 2])
    elif gate == "cu":
        index = get_qubits_by_keyword_or_position(
            caller, ["control_qubit", "target_qubit"], [4, 5])
    elif gate == "swap":
        index = get_qubits_by_keyword_or_position(caller, ["qubit1", "qubit2"],
                                                  [0, 1])
    elif gate == "ccx":
        index = get_qubits_by_keyword_or_position(
            caller, ["control_qubit1", "control_qubit2", "target_qubit"],
            [0, 1, 2])
    elif gate == "cswap":
        index = get_qubits_by_keyword_or_position(
            caller, ["control_qubit", "qubit1", "qubit2"], [0, 1, 2])
    return index


def qubit_index_getter(qubit):
    ast_node = ast.parse(qubit).body[0]
    if type(ast_node.value) == ast.Constant:
        return qubit
    else:
        return f"{qubit} if type({qubit}) == int else ({qubit}).index"


def reconstruct_node(func_list, structure_node, target):
    ast_node = structure_node["ast_node"]
    body = ast_node.body
    for_list = []
    for node in ast_node.body:
        # 如果是函数调用
        if type(node) == ast.Expr and type(node.value) == ast.Call:
            call = node.value
            func = call.func
            # 如果是函数且参数有 target
            if type(func) == ast.Name:
                if get_target_arg_pos(call.args, target) != -1\
                        or get_target_keyword(call.keywords,
                                              target) is not None:
                    # 传入 path 参数
                    call.keywords.append(ast.keyword("path", ast.Name("path")))
                    # 传入 base_index 参数
                    child_structure = None
                    for child in structure_node["children"]:
                        if node == child["ast_node"]:
                            child_structure = child
                            break
                    call.keywords.append(
                        ast.keyword(
                            "base_index",
                            ast.parse(
                                f"base_index + {child_structure['index']}").
                            body[0]))
            # 如果是方法且调用者为target
            elif type(func) == ast.Attribute and type(
                    func.value) == ast.Name and func.value.id == target:
                if func.attr in supported_gate_list:
                    qubits = get_qubits(call)
                    node_index = body.index(node)
                    tree_index = None
                    for child in structure_node["children"]:
                        if node == child["ast_node"]:
                            tree_index = child["index"]
                    if tree_index is None:
                        raise Exception("tree_index is None")
                    # 加入输出语句
                    module = ast.parse(f"""gates.append(
                            ['{func.attr}',
                            [{','.join([qubit_index_getter(qubit)
                                for qubit in qubits])}],
                            [get_timestamp()]*2, {tree_index} + base_index,
                            path.copy() + [get_index()]])""")
                    body.insert(node_index + 1, module.body[0])
        # 如果是赋值且目标为target(暂时不支持元组赋值)
        elif type(node) == ast.Assign and type(
                node.targets[0]) == ast.Name and node.targets[0].id == target:
            call = node.value
            if (type(call) == ast.Call):
                func = call.func
                # 是个函数且不是 QuantumCircuit 函数
                if type(func) == ast.Name and func.id != "QuantumCircuit":
                    # 传入 path 参数
                    call.keywords.append(ast.keyword("path", ast.Name("path")))
                    # 传入 base_index 参数
                    child_structure = None
                    for child in structure_node["children"]:
                        if node == child["ast_node"]:
                            child_structure = child
                            break
                    call.keywords.append(
                        ast.keyword(
                            "base_index",
                            ast.parse(
                                f"base_index + {child_structure['index']}").
                            body[0]))
        elif type(node) == ast.For:
            if node not in for_list:
                for_list.append(node)
                # 找到对应的 structure node
                child_index = None
                for child in structure_node["children"]:
                    if node == child["ast_node"]:
                        child_index = structure_node["children"].index(child)
                if child_index is not None:
                    # 记录当前 timestamp
                    node.body.insert(
                        0,
                        ast.parse(
                            "start_time = timestamp").body[0])
                    # 插入当前循环体范围
                    node.body.insert(
                        len(node.body),
                        ast.parse(
                            "range_list.append([start_time, timestamp - 1])").body[0])
                    child = structure_node["children"][child_index]
                    # 新建 range 数组
                    ast_node_index = body.index(node)
                    body.insert(ast_node_index,
                                ast.parse("range_list = []").body[0])
                    # 递归
                    reconstruct_node(func_list, child, target)
                    # 输出 semantics
                    ast_node_index = body.index(node)
                    body.insert(
                        ast_node_index + 1,
                        ast.parse(f"""semantics.append(
                            {{
                                'type': 'unknown',
                                'range': range_list,
                                'treeIndex': {child["index"]} + base_index,
                            }}
                            )""").body[0])
        elif type(node) == ast.FunctionDef:
            for func in func_list:
                if func["ast_node"] == node:
                    # 添加 path 参数
                    node.args.args.append(ast.arg("path", None))
                    # 添加 base_ndex 参数
                    node.args.args.append(ast.arg("base_index", None))
                    # 将当前节点的 index 加入 path
                    node.body.insert(
                        0,
                        ast.parse(
                            "path = path.copy() + [get_index()]").body[0])
                    reconstruct_node(func_list, func, func["target"])
                    break


def reconstruct_ast(func_list, structure, target, filename):
    global_module = structure["ast_node"]
    pre_process = []
    # 添加 uni_index 及其 getter
    pre_process += ast.parse("uni_index = 0").body
    pre_process += ast.parse("""def get_index():
            global uni_index
            temp = uni_index
            uni_index += 1
            return temp""").body
    # 添加 timestamp 及其 getter
    pre_process += ast.parse("timestamp = 0").body
    pre_process += ast.parse("""def get_timestamp():
            global timestamp
            temp = timestamp
            timestamp += 1
            return temp""").body
    # 添加 gate 数组
    pre_process += ast.parse("gates = []").body
    # 添加 semantics 数组
    pre_process += ast.parse("semantics = []").body
    # 添加 path 数组
    pre_process += ast.parse("path = [get_index()]").body
    # 添加 base_index
    pre_process += ast.parse("base_index = 0").body

    global_module.body = pre_process + global_module.body

    reconstruct_node(func_list, structure, target)
    global_module.body += ast.parse("import json").body
    global_module.body += ast.parse(
        f"gate_info = {{'qubit': {target}.num_qubits, 'gates': gates}}").body
    # 输出 gates
    global_module.body += ast.parse(
        f"""with open('{filename}_gates.json', 'w') as f:
            json.dump(gate_info, f)""").body
    # 输出 semantics
    global_module.body += ast.parse(
        f"""with open('{filename}_semantics.json', 'w') as f:
            json.dump(semantics, f)""").body

    return global_module


def count_gates_by_qubit(gates, gate_range):
    line_ends = {}
    start_time = gate_range[0][0]
    end_time = gate_range[len(gate_range) - 1][1]
    for i in range(start_time, end_time + 1):
        qubits = gates[i][1]
        furthest = 0
        for qubit in qubits:
            if qubit not in line_ends:
                line_ends[qubit] = 0
            else:
                furthest = max(furthest, line_ends[qubit])
        for qubit in qubits:
            line_ends[qubit] = furthest + 1
    return line_ends


def determine_rep_type(line_ends, rep_length):
    if (line_ends == {}):
        return "empty"
    line_count = len(line_ends.values())
    furthest = max(line_ends.values())
    if furthest >= rep_length and line_count >= rep_length:
        return "diagonal"
    elif furthest >= rep_length:
        return "horizontal"
    elif line_count >= rep_length:
        return "vertical"
    else:
        return "diagonal"


def set_semantic_types(filename):
    with open(f"{filename}_semantics.json", "r") as f:
        semantics = json.load(f)
    with open(f"{filename}_gates.json", "r") as f:
        gate_info = json.load(f)
        gates = gate_info["gates"]
    empty_list = []
    for semantic in semantics:
        gate_range = semantic["range"]
        if (gate_range == []):
            empty_list.append(semantic)
            continue
        line_ends = count_gates_by_qubit(gates, gate_range)
        type = determine_rep_type(
            line_ends, gate_range[len(gate_range) - 1][1] - gate_range[0][0] + 1)
        if (type == "empty"):
            empty_list.append(semantic)
        else:
            semantic["type"] = type
    for semantic in empty_list:
        semantics.remove(semantic)
    with open(f"{filename}_semantics.json", "w") as f:
        json.dump(semantics, f)
    return
