from qiskit import QuantumCircuit
import numpy as np


def swap_registers(circuit, n):
    for qubit in range(n // 2):
        circuit.swap(qubit, n - qubit - 1)
    return circuit


def qft(n):
    """Creates an n-qubit QFT circuit"""
    circuit = QuantumCircuit(n)

    for i in range(n, 0, -1):  
        circuit.h(i - 1)
        for qubit in range(i - 1):
            circuit.cp(np.pi / 2 ** (i - 1 - qubit), qubit, i - 1)
        
    swap_registers(circuit, n)
    return circuit


def get_cir(n):

    qc = qft(n)

    return qc


qc = get_cir(10)
