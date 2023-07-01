from qiskit import QuantumCircuit
import random
import numpy as np

def simon_oracle(qc, b):
    """returns a Simon oracle for bitstring b"""
    b = b[::-1] # reverse b for easy iteration
    n = len(b)
    # Do copy; |x>|0> -> |x>|x>
    for _index, q in enumerate(range(n)):
        qc.cx(q, q+n)

    i = b.find('1') # index of first non-zero bit in b
    # Do |x> -> |s.x> on condition that q_i is 1
    indexes = np.where(np.array(list(b)) == '1')[0].tolist()
    for q in indexes:
        qc.cx(i, q + n)


def get_cir(bitstring: str) -> QuantumCircuit:
    n = len(bitstring)
    simon_circuit = QuantumCircuit(n * 2)

    # Apply Hadamard gates before querying the oracle
    for q in range(n):
        simon_circuit.h(q)

    simon_oracle(simon_circuit, bitstring)

    # Apply Hadamard gates to the input register
    for q in range(n):
        simon_circuit.h(q)

    return simon_circuit

qc = get_cir('101')
