from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
import random


def CC(nCoins):
    n_qubits = nCoins + 1
    qr = QuantumRegister(n_qubits)
    cr = ClassicalRegister(n_qubits)
    qc = QuantumCircuit(qr, cr)

    indexOfFalseCoin = random.randint(0, nCoins - 1)

    for i in range(nCoins):
        qc.h(qr[i])
    for i in range(nCoins):
        qc.cx(qr[i], qr[nCoins])

    qc.x(qr[nCoins])
    qc.h(qr[nCoins])

    for i in range(nCoins):
        qc.h(qr[i])

    qc.cx(qr[indexOfFalseCoin], qr[nCoins])

    for i in range(nCoins):
        qc.h(qr[i])
    return qc


qc = CC(9)
