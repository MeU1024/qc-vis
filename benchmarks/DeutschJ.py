from ast import Sub
from secrets import choice
from qiskit import QuantumCircuit
import random


def get_balanced_oracle(n, b_str):
    if len(b_str) != n:
        raise Exception("bitstring length should be the same as n")
    balanced_oracle = QuantumCircuit(n + 1)
    # Place X-gates
    for qubit in range(len(b_str)):
        if b_str[qubit] == '1':
            balanced_oracle.x(qubit)

    # Use barrier as divider
    balanced_oracle.barrier()
    choice = random.randint(0, n-1)
    # Controlled-NOT gates
    for _index, qubit in enumerate(range(n)):
        balanced_oracle.cx(qubit, n)

    balanced_oracle.barrier()

    # Place X-gates
    for qubit in range(len(b_str)):
        if b_str[qubit] == '1':
            balanced_oracle.x(qubit)

    return balanced_oracle

def get_cir(n, b_str):
    dj_circuit = QuantumCircuit(n+1)

    # Apply H-gates
    for qubit in range(n):
        dj_circuit.h(qubit)

    # Put qubit in state |->
    dj_circuit.x(n)
    dj_circuit.h(n)

    # Add oracle
    dj_circuit += get_balanced_oracle(n, b_str)

    # Repeat H-gates
    for qubit in range(n):
        dj_circuit.h(qubit)
    dj_circuit.barrier()

    return dj_circuit