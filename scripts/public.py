import ast

supported_gate_list = [
    "x", "y", "z", "h", "s", "sdg", "t", "tdg", "rx", "ry", "rz", "u", "p",
    "i", "id", "cx", "cy", "cz", "ch", "cry", "crz", "cp", "cu", "swap", "ccx",
    "cswap", "ryy"
]


def get_target_arg_pos(args, target):
    for arg in args:
        if type(arg) == ast.Name and arg.id == target:
            return args.index(arg)
    return -1


def get_target_keyword(keywords, target):
    for keyword in keywords:
        if type(keyword) == ast.keyword and type(keyword.value) == ast.Name:
            if keyword.value.id == target:
                return keyword.arg
    return None


class Index:

    def __init__(self, init_value=0):
        self.value = init_value

    def getter(self) -> int:
        temp = self.value
        self.value += 1
        return temp
