from re import sub
from secrets import choice
import qiskit
import numpy as np


class VQC:
    def __init__(self, qubit_count, bug):
        self.qubit_count = qubit_count
        self.bug = bug
        self.quantum_register = qiskit.circuit.QuantumRegister(self.qubit_count)
        self.classical_register = qiskit.circuit.ClassicalRegister(self.qubit_count)
        self.circuit = qiskit.circuit.QuantumCircuit(self.quantum_register)
        self.layer_count = 4
        self.hadamard_circuit()
        self.phase_addition()
        self.learnable_layers()

    def hadamard_circuit(self):
        for qubit in self.quantum_register:
            self.circuit.h(qubit)

    def phase_addition(self):
        choice = np.random.randint(0, len(self.quantum_register[:-1]))
        for qubit in self.quantum_register:
            self.circuit.rz(np.random.rand() * np.pi, qubit)
        for _index, (cqubit, aqubit) in enumerate(zip(self.quantum_register[:-1], self.quantum_register[1:])):
            if choice != _index:
                self.circuit.cx(cqubit, aqubit)
                self.circuit.rz(np.random.rand() * np.pi, aqubit)
                self.circuit.cx(cqubit, aqubit)
            else:
                if self.bug == 1:
                    self.circuit.cx(cqubit, aqubit)
                    self.circuit.rz(np.random.rand() * np.pi, aqubit)
                    self.circuit.cx(cqubit, aqubit)
                    self.circuit.cx(cqubit, aqubit)
                    self.circuit.rz(np.random.rand() * np.pi, aqubit)
                    self.circuit.cx(cqubit, aqubit) 
                elif self.bug == 2:
                    sub_circuit = qiskit.circuit.QuantumCircuit(self.quantum_register)
                    sub_circuit.cx(cqubit, aqubit)
                    sub_circuit.rz(np.random.rand() * np.pi, aqubit)
                    sub_circuit.cx(cqubit, aqubit)
                    sub_circuit = sub_circuit.reverse_bits()
                    self.circuit.compose(sub_circuit, inplace=True)
                elif self.bug == 3:
                    self.circuit.cy(cqubit, aqubit)
                    self.circuit.rz(np.random.rand() * np.pi, aqubit)
                    self.circuit.cx(cqubit, aqubit)
                else:
                    self.circuit.cx(cqubit, aqubit)
                    self.circuit.rz(np.random.rand() * np.pi, aqubit)
                    self.circuit.cx(cqubit, aqubit)

    def learnable_layers(self):
        for _ in range(self.layer_count):
            for qubit in self.quantum_register:
                self.circuit.ry(np.random.rand() * np.pi, qubit)
                self.circuit.rz(np.random.rand() * np.pi, qubit)
            qbs = list(self.quantum_register)
            for i, qb in enumerate(qbs):
                for j in range(i + 1, self.qubit_count):
                    self.circuit.cz(qb, qbs[j])


def get_cir(n_qubits, bug=0):
    return VQC(n_qubits, bug).circuit
