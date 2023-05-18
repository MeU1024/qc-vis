import ast
import json
from structure import extract_target_tree, tree_to_list
from gates_and_semantics import reconstruct_ast


def parse_file(file_path, target, filename):
    with open(file_path, 'r') as f:
        file = f.read()
    ast_tree = ast.parse(file)
    target_tree = extract_target_tree(ast_tree, target)
    node_list = tree_to_list(target_tree)
    print_structure(node_list, filename)
    new_ast = reconstruct_ast(target_tree, target)
    ast.unparse(new_ast)
    print_file(filename + "_new.py", ast.unparse(new_ast))


def print_structure(structure, filename):
    with open(filename + "_structure.json", 'w') as f:
        json.dump(structure, f, indent=4)


def print_file(file_path, str):
    with open(file_path, 'w') as f:
        f.write(str)


parse_file("algorithms/W_state.py", "qc", "W_state")
