import ast
from public import get_target_arg_pos, get_target_keyword, supported_gate_list


def extract_target_function(ast_tree, func_name, target_pos, target_name=None):
    # 找到相应的函数定义
    func = None
    for node in ast_tree.body:
        if type(node) == ast.FunctionDef and node.name == func_name:
            func = node
            break
    if func is None:
        print("Error: function " + func_name + " not found")
        return None
    # 构建函数树
    root = {"name": func_name, "type": "fun", "ast_node": func, "children": []}
    target = None
    if target_pos == -1:
        for stmt in func.body:
            if type(stmt) == ast.Return:
                ret = stmt.value
                if type(ret) == ast.Name:
                    target = ret.id
    else:
        target = target_name if target_name is not None else func.args.args[
            target_pos].arg
    if target is None:
        print("Error: target not found")
        return None
    print("Extracting function " + func_name + " with target " + target)
    for node in func.body:
        travel_and_extract(ast_tree, node, root, target)
    return root


# 遍历所有节点，构建和 target 相关的树
def travel_and_extract(tree, node, father, target):
    if type(node) == ast.Expr:
        call = node.value
        if type(call) == ast.Call:
            func = call.func
            # 如果是函数且参数有 target
            if type(func) == ast.Name:
                if get_target_arg_pos(call.args, target) != -1:
                    father["children"].append(
                        extract_target_function(
                            tree, func.id,
                            get_target_arg_pos(call.args, target)))
                else:
                    arg = get_target_keyword(call.keywords, target)
                    if arg is not None:
                        father["children"].append(
                            extract_target_function(tree, func.id, -1, arg))
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
                    extract_target_function(tree, func.id, -1))
    # 如果是循环
    elif type(node) == ast.For:
        rep = {"name": "for", "type": "rep", "ast_node": node, "children": []}
        father["children"].append(rep)
        for child in node.body:
            travel_and_extract(tree, child, rep, target)
        # 构建循环名字
        names = []
        for child in rep["children"]:
            if child["type"] == "rep_item":
                names.append(child["name"])
            elif child["type"] == "fun":
                names.append(child["name"])
        rep["name"] = "[" + "-".join(names) + "]"


def extract_target_tree(ast_tree, target):
    root = {
        "name": "global",
        "type": "fun",
        "ast_node": ast_tree,
        "children": []
    }
    for node in ast_tree.body:
        travel_and_extract(ast_tree, node, root, target)
    return root


def tree_to_list(root):
    structure_list = []

    class Index:

        def __init__(self):
            self.value = 0

        def getter(self) -> int:
            temp = self.value
            self.value += 1
            return temp

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
        if "children" in node:
            for child in node["children"]:
                preorder_output(child, cur_index)

    preorder_output(root, -1)
    print(structure_list)
    return structure_list
