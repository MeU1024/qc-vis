from ast import Sub
from secrets import choice
from qiskit import QuantumCircuit
import random
import numpy as np


def BalancedOracle(circuit, n, b_str):
    if len(b_str) != n:
        raise Exception("bitstring length should be the same as n")
    b_list = np.array(list(b_str))
    indexes = np.where(b_list == '1')[0].tolist()
    # Place X-gates
    for qubit in indexes:
        circuit.x(qubit)

    # Controlled-NOT gates
    for _index, qubit in enumerate(range(n)):
        circuit.cx(qubit, n)

    # Place X-gates
    for qubit in indexes:
        circuit.x(qubit)
        

def get_cir(n, b_str):
    dj_circuit = QuantumCircuit(n+1)

    # Apply H-gates
    for qubit in range(n):
        dj_circuit.h(qubit)

    # Put qubit in state |->
    dj_circuit.x(n)
    dj_circuit.h(n)

    # Add oracle
    BalancedOracle(dj_circuit, n, b_str)

    # Repeat H-gates
    for qubit in range(n):
        dj_circuit.h(qubit)

    return dj_circuit

qc = get_cir(5, '10101')
