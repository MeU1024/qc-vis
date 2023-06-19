from qiskit import QuantumCircuit
import numpy as np


def init(num_qubits: int, time_step: int = 1, total_time: int = 1) -> QuantumCircuit:
    qc = circuit(num_qubits, time_step, total_time)
    return qc


def circuit(num_qubits, time_step, total_time) -> QuantumCircuit:
    """Generate a circuit to simulate the evolution of an n-qubit TFIM
    chain under the Hamiltonian:
    H(t) = - Jz * sum_{i=1}^{n-1}(sigma_{z}^{i} * sigma_{z}^{i+1})
           - e_ph * cos(w_ph * t) * sum_{i=1}^{n}(sigma_{x}^{i})
    where,
        w_ph: frequency of E" phonon in MoSe2.
        e_ph: strength of electron-phonon coupling.
    """
    hbar = 0.658212  # eV*fs
    jz = (
        hbar * np.pi / 4
    )  # eV, coupling coeff; Jz<0 is antiferromagnetic, Jz>0 is ferromagnetic
    freq = 0.0048  # 1/fs, frequency of MoSe2 phonon
    w_ph = 2 * np.pi * freq
    e_ph = 3 * np.pi * hbar / (8 * np.cos(np.pi * freq))
    circuit = QuantumCircuit(num_qubits)
    # Build up the circuit over total_time / time_step propagation steps
    for step in range(int(total_time / time_step)):
        # Simulate the Hamiltonian term-by-term
        t = (step + 0.5) * time_step
        # Single qubit terms
        psi = -2.0 * e_ph * np.cos(w_ph * t) * time_step / hbar
        for qubit in range(num_qubits):
            circuit.h(qubit)
            circuit.rz(psi, qubit)
            circuit.h(qubit)
        # Coupling terms
        psi2 = -2.0 * jz * time_step / hbar
        choice = np.random.randint(0, num_qubits - 1)
        for i in range(num_qubits - 1):
            sub_circuit = QuantumCircuit(num_qubits)
            sub_circuit.cx(i, i + 1)
            sub_circuit.rz(psi2, i + 1)
            sub_circuit.cx(i, i + 1)
            circuit.compose(sub_circuit, inplace=True)
    return circuit


def get_cir(n):
    qc = init(n)
    return qc


qc = get_cir(4)
