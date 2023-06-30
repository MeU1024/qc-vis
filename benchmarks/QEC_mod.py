import qiskit

def state_preparation(circuit: qiskit.QuantumCircuit, qubits: qiskit.QuantumRegister):
    circuit.h(qubits[0])
    circuit.cx(qubits[0], qubits[1])
    circuit.cx(qubits[1], qubits[2])
    circuit.cx(qubits[0], qubits[3])
    circuit.cx(qubits[1], qubits[3])
    circuit.cx(qubits[1], qubits[4])
    circuit.cx(qubits[1], qubits[4])


def get_cir(k):
    qubits = qiskit.QuantumRegister(5 * k)
    circuit = qiskit.QuantumCircuit(qubits)
    for i in range(0, len(qubits), 5):
        state_preparation(circuit, qubits[i:i + 5])
    return circuit

qc = get_cir(10)
