import qiskit
import numpy as np

class QSVM:
    def __init__(self, qubit_count):
        self.qubit_count = qubit_count
        self.quantum_register = qiskit.circuit.QuantumRegister(self.qubit_count)
        self.classical_register = qiskit.circuit.ClassicalRegister(self.qubit_count)
        self.circuit = qiskit.circuit.QuantumCircuit(self.quantum_register)
        self.hadamard_circuit()
        self.phase_addition()
        self.hadamard_circuit()

    def hadamard_circuit(self):
        for qubit in self.quantum_register:
            self.circuit.h(qubit)

    def phase_addition(self):
        for qubit in self.quantum_register:
            self.circuit.p(np.random.rand() * np.pi, qubit)
        for _index, (cqubit, aqubit) in enumerate(zip(self.quantum_register[:-1], self.quantum_register[1:])):
            self.circuit.cx(cqubit, aqubit)
            self.circuit.rz(np.random.rand() * np.pi, aqubit)
            self.circuit.cx(cqubit, aqubit)

        iterables = list(self.quantum_register).copy()
        iterables.reverse()
        l1 = iterables[:-1]
        l2 = iterables[1:]
        for a1, a2 in zip(l1, l2):
            self.circuit.cx(a2, a1)
            self.circuit.rz(np.random.rand() * np.pi, a1)
            self.circuit.cx(a2, a1)
        for qubit in self.quantum_register:
            self.circuit.rz(np.random.rand() * np.pi, qubit)


def get_cir(n_qubits):
    return QSVM(n_qubits).circuit