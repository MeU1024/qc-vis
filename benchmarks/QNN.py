import numpy as np
from qiskit import QuantumCircuit
import random

# random.seed(555)


def ran_ang():
    return np.random.rand() * 2 * np.pi


def init_random_variables(n):
    trainable_variables = {}
    for i in np.arange(1, n + 1):
        trainable_variables[str(i)] = [ran_ang(), ran_ang()]
        if i != n:
            trainable_variables[str(i) + "," + str(i + 1)] = [ran_ang(), ran_ang()]
            trainable_variables[str(i) + "--" + str(i + 1)] = [ran_ang(), ran_ang()]
    return trainable_variables


def single_qubit_unitary(qc, qubit_index, values):
    qc.ry(float(values[0]), int(qubit_index))
    qc.rz(float(values[1]), int(qubit_index))


def dual_qubit_unitary(qc, qubit_1, qubit_2, values):
    qc.ryy(float(values[0]), int(qubit_1), int(qubit_2))
    qc.rzz(float(values[1]), int(qubit_1), int(qubit_2))


def controlled_dual_qubit_unitary(qc, control_qubit, act_qubit, values):
    qc.cry(float(values[0]), int(control_qubit), int(act_qubit))
    qc.crz(float(values[1]), int(control_qubit), int(act_qubit))


def traditional_learning_layer(qc, n, values, qubit_start, qubit_end):
    for qub in np.arange(qubit_start, qubit_end):
        single_qubit_unitary(qc, qub, values[str(qub)])
    for qub in np.arange(qubit_start, qubit_end - 1):
        dual_qubit_unitary(qc, qub, qub + 1, values[str(qub) + "," + str(qub + 1)])
    for qub in np.arange(qubit_start, qubit_end - 1):
        controlled_dual_qubit_unitary(qc, qub, qub + 1, values[str(qub) + "--" + str(qub + 1)])


def data_loading_circuit(qc, num_qubits, values, qubit_start, qubit_end):
    k = 0
    choice = np.random.randint(qubit_start, qubit_end)
    for qub in np.arange(qubit_start, qubit_end):
        qc.ry(float(values[k]), int(qub))
        qc.rz(float(values[k + 1]), int(qub))
        k += 2


def swap_test(qc, num_qubits):
    num_swap = num_qubits // 2
    for i in range(num_swap):
        qc.cswap(0, i + 1, i + num_swap + 1)
    qc.h(0)

def get_cir(n):
    data = [np.random.rand() * 2.0 * np.pi - np.pi for i in range(0, 50)]

    qc = QuantumCircuit(n)
    training_variables = init_random_variables(n - 1)
    qc.h(0)
    traditional_learning_layer(qc, n, training_variables, qubit_start=1, qubit_end=n // 2 + 1)
    data_loading_circuit(qc, n, data, qubit_start=n // 2 + 1, qubit_end=n)
    swap_test(qc, n)
    return qc
