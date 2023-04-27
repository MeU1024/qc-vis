from audioop import add
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
import sys
import random
import math
import json


uni_index =0


def carry(qc, c0, a, b, c1, layers, semantics, time_stamp,adder_index,op_index,mul_index):
    global uni_index
    uni_index += 1
    carry_index = uni_index

    uni_index += 1
    qc.ccx(a, b, c1)
    layers.append([['ccx', [a.index, b.index, c1.index], [time_stamp, time_stamp], 15,
                    [uni_index,carry_index, adder_index,op_index, mul_index, 0][::-1]]])
    time_stamp += 1

    uni_index += 1
    qc.cx(a, b)
    layers.append([['cx', [a.index, b.index], [time_stamp, time_stamp], 16,
                    [uni_index,carry_index, adder_index,op_index, mul_index, 0][::-1]]])
    time_stamp += 1

    uni_index += 1
    qc.ccx(c0, b, c1)
    layers.append([['ccx', [c0.index, b.index, c1.index], [time_stamp, time_stamp], 17,
                    [uni_index, carry_index,adder_index,op_index, mul_index, 0][::-1]]])
    time_stamp += 1


    return layers, semantics, time_stamp


def uncarry(qc, c0, a, b, c1, layers, semantics, time_stamp, if_uncarry_index,adder_index,op_index,mul_index,):
    global uni_index
    uni_index+=1
    un_carry_index = uni_index

    uni_index += 1
    qc.ccx(c0, b, c1)
    layers.append([['ccx', [c0.index, b.index, c1.index], [time_stamp, time_stamp], 24,
                    [uni_index,un_carry_index,if_uncarry_index,adder_index,op_index,mul_index, 0][::-1]]])
    time_stamp += 1

    uni_index += 1
    qc.cx(a, b)
    layers.append([['cx', [a.index, b.index], [time_stamp, time_stamp], 25,
                    [uni_index,un_carry_index,if_uncarry_index,adder_index,op_index,mul_index, 0][::-1]]])
    time_stamp += 1

    uni_index += 1
    qc.ccx(a, b, c1)
    layers.append([['ccx', [a.index, b.index, c1.index], [time_stamp, time_stamp], 26,
                    [uni_index,un_carry_index,if_uncarry_index,adder_index,op_index,mul_index, 0][::-1]]])
    time_stamp += 1


    return layers, semantics, time_stamp


def carry_sum(qc, c0, a, b, layers, semantics, time_stamp, adder_index,op_index,mul_index, bug=0):
    global uni_index
    uni_index += 1
    carry_sum_index = uni_index

    uni_index += 1
    qc.cx(a, b)
    layers.append([['cx', [a.index, b.index], [time_stamp, time_stamp], 19,
                    [uni_index, carry_sum_index,adder_index,op_index,mul_index, 0][::-1]]])
    time_stamp += 1

    uni_index += 1
    qc.cx(c0, b)
    layers.append([['cx', [c0.index, b.index], [time_stamp, time_stamp], 20,
                    [uni_index,carry_sum_index, adder_index,op_index,mul_index, 0][::-1]]])
    time_stamp += 1


    return layers, semantics, time_stamp


def carry_sum2(qc, c0, a, b, layers, semantics, time_stamp, if_uncarry_index,adder_index,op_index,mul_index, bug=0):
    global uni_index
    uni_index += 1
    carry_sum_index = uni_index

    uni_index += 1
    qc.cx(a, b)
    layers.append([['cx', [a.index, b.index], [time_stamp, time_stamp], 28,
                    [uni_index,carry_sum_index,if_uncarry_index,adder_index,op_index,mul_index, 0][::-1]]])
    time_stamp += 1

    uni_index += 1
    qc.cx(c0, b)
    layers.append([['cx', [c0.index, b.index], [time_stamp, time_stamp], 29,
                    [uni_index,carry_sum_index,if_uncarry_index,adder_index,op_index,mul_index, 0][::-1]]])
    time_stamp += 1


    return layers, semantics, time_stamp


def adder(qc, qubits, layers, semantics, time_stamp, op_index,mul_index, bug=0):
    n = int(len(qubits) / 3)
    c = qubits[0::3]
    a = qubits[1::3]
    b = qubits[2::3]

    global uni_index

    #adder_index
    uni_index += 1
    adder_index = uni_index

    start_time = time_stamp
    for i in range(0, n - 1):
        layers, semantics, time_stamp = carry(qc, c[i], a[i], b[i], c[i + 1], layers, semantics, time_stamp,  adder_index,op_index,mul_index)
        qc.barrier()
    qc.barrier()
    semantics.append({"type": "diagonal", "range": [start_time, time_stamp - 1, 3], "treeIndex": 13})

    layers, semantics, time_stamp = carry_sum(qc, c[n - 1], a[n - 1], b[n - 1], layers, semantics, time_stamp, adder_index,op_index,mul_index,
                                              bug)
    qc.barrier()

    start_time = time_stamp
    for i in range(n - 2, -1, -1):
        uni_index += 1
        if_uncarry_index = uni_index

        layers, semantics, time_stamp = uncarry(qc, c[i], a[i], b[i], c[i + 1], layers, semantics, time_stamp, if_uncarry_index, adder_index, op_index, mul_index, )
        qc.barrier()
        layers, semantics, time_stamp = carry_sum2(qc, c[i], a[i], b[i], layers, semantics, time_stamp, if_uncarry_index,adder_index,op_index,mul_index )
        qc.barrier()
    semantics.append({"type": "diagonal", "range": [start_time, time_stamp - 1, 5], "treeIndex": 21})
    qc.barrier()

    uni_index += 1
    return layers, semantics, time_stamp


def multiplier(qc, qubits, layers, semantics, time_stamp, bug=0):
    n = int(len(qubits) / 5)
    a = qubits[1:n * 3:3]
    y = qubits[n * 3:n * 4]
    x = qubits[n * 4:]
    global uni_index
    uni_index += 1
    mul_index = uni_index

    op_start_time = time_stamp
    for i, x_i in enumerate(x):  # operation
        uni_index += 1
        op_index = uni_index

        start_time = time_stamp
        for j, (a_qubit, y_qubit) in enumerate(zip(a[i:], y[:n - i])):  # ccx+adder
            uni_index += 1
            qc.ccx(x_i, y_qubit, a_qubit)
            layers.append([['ccx', [x_i.index, y_qubit.index, a_qubit.index], [time_stamp, time_stamp], 11,
                            [uni_index, op_index, mul_index, 0][::-1]]])
            time_stamp += 1
        semantics.append({"type": "horizontal", "range": [start_time, time_stamp - 1, 1], "treeIndex": 10})

        layers, semantics, time_stamp = adder(qc, qubits[:3 * n], layers, semantics, time_stamp, op_index, mul_index)

        qc.barrier()

        start_time = time_stamp
        for j, (a_qubit, y_qubit) in enumerate(zip(a[i:], y[:n - i])):
            qc.ccx(x_i, y_qubit, a_qubit)
            uni_index += 1
            layers.append([['ccx', [x_i.index, y_qubit.index, a_qubit.index], [time_stamp, time_stamp], 31, [uni_index, op_index, mul_index, 0][::-1]]])
            time_stamp += 1
        semantics.append({"type": "horizontal", "range": [start_time, time_stamp - 1, 1], "treeIndex": 30})
        qc.barrier()

    # semantics.append({"type": "horizontal", "range": [op_start_time, time_stamp - 1, 1], "treeIndex": 30})
    qc.barrier()
    return layers, semantics, time_stamp


def init_bits(qc, x_bin, index, layers, semantics, time_stamp, *qubits):
    global uni_index
    uni_index += 1
    init_index = uni_index

    for x, qubit in zip(x_bin, list(qubits)[::-1]):
        if x == '1':
            qc.x(qubit)
            uni_index += 1
            layers.append([['x', [qubit.index], [time_stamp, time_stamp], index, [uni_index, init_index,0][::-1]]])
            time_stamp += 1

    #init

    return layers, semantics, time_stamp


def get_cir(n, layers, semantics, bug=0):
    global uni_index
    n_qubits = 5 * n
    # random.seed(555)
    qr = QuantumRegister(n_qubits)
    qc = QuantumCircuit(qr)

    time_stamp = 0

    maxv = math.floor(math.sqrt(2 ** (n)))
    # p = random.randint(1, maxv)
    # q = random.randint(1, maxv)
    p = maxv-1
    q = maxv-1

    y_bin = '{:08b}'.format(p)[-n:]
    x_bin = '{:08b}'.format(q)[-n:]

    # c = qr[0:n*3:3]
    # a = qr[1:n*3:3]
    b = qr[2:n * 3:3]
    y = qr[n * 3:n * 4]
    x = qr[n * 4:]

    layers, semantics, time_stamp = init_bits(qc, x_bin, 3, layers, semantics, time_stamp, uni_index, *x)
    layers, semantics, time_stamp = init_bits(qc, y_bin, 6, layers, semantics, time_stamp, uni_index, *y)
    qc.barrier()


    layers, semantics, time_stamp = multiplier(qc, qr, layers, semantics, time_stamp, bug)

    return qc, layers, semantics


def get_multiplier_cir(n):
    semantics = []
    layers = []
    qubits = []
    for i in range(n):
        qubits.append(str(i))

    qc, layers, semantics = get_cir(n // 5, layers, semantics)

    json_data = {'layers': layers, 'qubits': qubits, 'semantics': semantics}
    with open('./mul/mul_json_data_15.json', 'w', encoding='utf-8') as f:
        json.dump(json_data, f, ensure_ascii=False, indent=4)

    return qc


circuit = get_multiplier_cir(15)

# print(circuit.draw(output='mpl', fold=300, filename='./mul/mul'))