import imp
import qiskit
from qiskit.algorithms.linear_solvers import LinearSystemMatrix

def state_preparation(circuit: qiskit.QuantumCircuit, qubits: qiskit.QuantumRegister):
    # Prepare 3-bit code accross 3 quits ( I.e |111> + |000> )
    assert len(qubits) == 5
    circuit.h(qubits[0])
    circuit.cnot(qubits[0], qubits[1])
    circuit.cnot(qubits[1], qubits[2])
    # Now we do the error test

    circuit.cnot(qubits[0], qubits[3])
    circuit.cnot(qubits[1], qubits[3])
    circuit.cnot(qubits[1], qubits[4])
    circuit.cnot(qubits[1], qubits[4])
    # circuit.measure(qubits[3], cbits[0])
    # circuit.measure(qubits[4], cbits[1])


def get_cir(k, bug = 0):
    qubits = qiskit.QuantumRegister(5 * k)
    circuit = qiskit.QuantumCircuit(qubits)
    for i in range(0, len(qubits), 5):
        state_preparation(circuit, qubits[i:i + 5])
    return circuit
