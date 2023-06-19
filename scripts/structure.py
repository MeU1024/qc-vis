import ast
from public import get_target_arg_pos, get_target_keyword, supported_gate_list


class Index:

    def __init__(self, init_value=0):
        self.value = init_value

    def getter(self) -> int:
        temp = self.value
        self.value += 1
        return temp


def extract_target_function(func_list,
                            ast_tree,
                            func_name,
                            caller_node,
                            target_pos,
                            target_name=None):
    # 找到相应的函数定义
    func_def = None
    for node in ast_tree.body:
        if type(node) == ast.FunctionDef and node.name == func_name:
            func_def = node
            break
    if func_def is None:
        print("Error: function " + func_name + " not found")
        return None
    # 构建函数树
    root = {
        "name": "_" + func_name,
        "type": "fun",
        "ast_node": caller_node,
        "children": []
    }
    target = None
    if target_pos == -1:
        for stmt in func_def.body:
            if type(stmt) == ast.Return:
                ret = stmt.value
                if type(ret) == ast.Name:
                    target = ret.id
    else:
        target = target_name if target_name is not None else func_def.args\
            .args[target_pos].arg
    if target is None:
        print("Error: target not found")
        return None
    print("Extracting function " + func_name + " with target " + target)
    for node in func_def.body:
        travel_and_extract(ast_tree, node, root, target, func_list)
    # 将函数加入函数列表
    added = False
    for node in func_list:
        if node["ast_node"] == func_def:
            added = True
            break
    if not added:
        func_root = {"name": func_name, "ast_node": func_def,
                     "target": target, "children": []}
        index = Index(1)

        def preoder_add_node(structure_node, father):
            func_node = {
                "name": structure_node["name"],
                "type": structure_node["type"],
                "ast_node": structure_node["ast_node"],
                "index": index.getter(),
                "children": [],
            }
            father["children"].append(func_node)
            if "children" in structure_node:
                for child in structure_node["children"]:
                    preoder_add_node(child, func_node)

        for node in root["children"]:
            preoder_add_node(node, func_root)
        func_list.append(func_root)
    return root


# 遍历所有节点，构建和 target 相关的树
def travel_and_extract(tree, node, father, target, func_list):
    if type(node) == ast.Expr:
        call = node.value
        if type(call) == ast.Call:
            func = call.func
            # 如果是函数且参数有 target
            if type(func) == ast.Name:
                if get_target_arg_pos(call.args, target) != -1:
                    father["children"].append(
                        extract_target_function(
                            func_list, tree, func.id, node,
                            get_target_arg_pos(call.args, target)))
                else:
                    arg = get_target_keyword(call.keywords, target)
                    if arg is not None:
                        father["children"].append(
                            extract_target_function(func_list, tree, func.id,
                                                    node, None, arg))
            # 如果是方法且调用者为target
            elif type(func) == ast.Attribute and type(
                    func.value) == ast.Name and func.value.id == target:
                if func.attr in supported_gate_list:
                    father["children"].append({
                        "name": func.attr,
                        "ast_node": node,
                        "type": "rep_item"
                    })
    # 如果是赋值且目标为target(暂时不支持元组赋值)
    elif type(node) == ast.Assign and type(
            node.targets[0]) == ast.Name and node.targets[0].id == target:
        call = node.value
        if (type(call) == ast.Call):
            func = call.func
            # 是个函数且不是 QuantumCircuit 函数
            if type(func) == ast.Name and func.id != "QuantumCircuit":
                father["children"].append(
                    extract_target_function(func_list, tree, func.id, node,
                                            -1))
    # 如果是循环
    elif type(node) == ast.For:
        rep = {"name": "for", "type": "rep", "ast_node": node, "children": []}
        for child in node.body:
            travel_and_extract(tree, child, rep, target, func_list)
        # 构建循环名字
        names = []
        for child in rep["children"]:
            if child["type"] == "rep_item" or child["type"] == "rep":
                names.append(child["name"])
            elif child["type"] == "fun":
                names.append(child["name"])
        if len(names) > 0:
            rep["name"] = "[" + "-".join(names) + "]"
            father["children"].append(rep)


def extract_target_tree(ast_tree, target, file_name):
    func_list = []
    root = {
        "name": file_name,
        "type": "fun",
        "ast_node": ast_tree,
        "children": []
    }
    for node in ast_tree.body:
        travel_and_extract(ast_tree, node, root, target, func_list)
    return root, func_list


def tree_to_list(root):
    structure_list = []

    index = Index()

    def preorder_output(node, parent_index):
        cur_index = index.getter()
        structure_list.append({
            "name": node["name"],
            "parentIndex": parent_index,
            "index": cur_index,
            "type": node["type"]
        })
        node["index"] = cur_index
        node["parentIndex"] = parent_index
        if "children" in node:
            for child in node["children"]:
                preorder_output(child, cur_index)

    preorder_output(root, 0)
    return structure_list
