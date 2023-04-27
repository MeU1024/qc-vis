import qiskit
import numpy as np


class QuGAN:
    def __init__(self, qubit_count):
        self.qubit_count = qubit_count
        self.quantum_register = qiskit.circuit.QuantumRegister(self.qubit_count)
        self.classical_register = qiskit.circuit.ClassicalRegister((self.qubit_count - 1) // 2)
        self.circuit = qiskit.circuit.QuantumCircuit(self.quantum_register)
        self.data_load()
        self.swap_test()
        self.generate_samples()

    def data_load(self):
        for qubit in list(self.quantum_register)[1:]:
            self.circuit.ry(np.random.rand() * np.pi, qubit)
        qubit_list = list(self.quantum_register)[1:]
        s1 = qubit_list[:len(qubit_list) // 2]
        s1_a, s1_b = s1[:-1], s1[1:]
        s2 = qubit_list[len(qubit_list) // 2:]
        s2_a, s2_b = s2[:-1], s2[1:]
        choice = np.random.randint(0, len(s1_a))
        for _index, (qa, qb) in enumerate(zip(s1_a, s1_b)):
            self.circuit.ryy(np.random.rand() * np.pi, qa, qb)
            self.circuit.cry(np.random.rand() * np.pi, qa, qb)
        for qa, qb in zip(s2_a, s2_b):
            self.circuit.ryy(np.random.rand() * np.pi, qa, qb)
            self.circuit.cry(np.random.rand() * np.pi, qa, qb)

    def swap_test(self):
        self.circuit.h(0)
        qubit_list = list(self.quantum_register)[1:]
        q1 = qubit_list[:len(qubit_list) // 2]
        q2 = qubit_list[len(qubit_list) // 2:]
        for q_1, q_2 in zip(q1, q2):
            self.circuit.cswap(self.quantum_register[0], q_1, q_2)
        self.circuit.h(0)

    def generate_samples(self):
        qubit_list = list(self.quantum_register)[1:]
        s2 = qubit_list[len(qubit_list) // 2:]


# 大于等于3的奇数
def get_cir(n_qubits):
    return QuGAN(n_qubits).circuit
