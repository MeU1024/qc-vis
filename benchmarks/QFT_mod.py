from qiskit import QuantumCircuit
import numpy as np


def swap_registers(circuit, n):
    for qubit in range(n // 2):
        circuit.swap(qubit, n - qubit - 1)
    return circuit


def qft_rotations(circuit, n):
    """Performs qft on the first n qubits in circuit (without swaps)"""
    if n == 0:
        return circuit
    n -= 1
    circuit.h(n)
    for qubit in range(n):
        circuit.cp(np.pi / 2 ** (n - qubit), qubit, n)
    qft_rotations(circuit, n)


def qft(n):
    """Creates an n-qubit QFT circuit"""
    circuit = QuantumCircuit(n)

    qft_rotations(circuit, n)
    swap_registers(circuit, n)
    return circuit


def get_cir(n):

    qc = qft(n)

    return qc


qc = get_cir(2)
