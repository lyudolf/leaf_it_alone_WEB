"""
MoleSniper ONNX Model Generator (No PyTorch)
Creates a minimal ONNX model for the MoleSniper AI using only numpy and onnx.

Usage:
    pip install onnx numpy
    python scripts/generate_mole_sniper_onnx.py

Output:
    public/models/mole_sniper.onnx
"""

import os
import numpy as np

try:
    import onnx
    from onnx import helper, TensorProto, numpy_helper
except ImportError:
    print("Installing onnx...")
    os.system("pip install onnx")
    import onnx
    from onnx import helper, TensorProto, numpy_helper

# Constants
INPUT_SIZE = 324  # 320 (density) + 4 (player pos/dir)
HIDDEN_SIZE = 128
OUTPUT_SIZE = 320  # 20x16 grid

def create_random_weights():
    """Create random weights for the MLP."""
    np.random.seed(42)  # Reproducible
    
    # Layer 1: 324 -> 128
    w1 = np.random.randn(INPUT_SIZE, HIDDEN_SIZE).astype(np.float32) * 0.1
    b1 = np.zeros(HIDDEN_SIZE, dtype=np.float32)
    
    # Layer 2: 128 -> 320
    w2 = np.random.randn(HIDDEN_SIZE, OUTPUT_SIZE).astype(np.float32) * 0.1
    b2 = np.zeros(OUTPUT_SIZE, dtype=np.float32)
    
    return w1, b1, w2, b2

def create_onnx_model():
    """Create the ONNX model graph."""
    w1, b1, w2, b2 = create_random_weights()
    
    # Initializers (weights)
    w1_init = numpy_helper.from_array(w1, name='w1')
    b1_init = numpy_helper.from_array(b1, name='b1')
    w2_init = numpy_helper.from_array(w2, name='w2')
    b2_init = numpy_helper.from_array(b2, name='b2')
    
    # Input
    input_tensor = helper.make_tensor_value_info('input', TensorProto.FLOAT, [1, INPUT_SIZE])
    
    # Output
    output_tensor = helper.make_tensor_value_info('output', TensorProto.FLOAT, [1, OUTPUT_SIZE])
    
    # Nodes
    # MatMul(input, w1)
    matmul1 = helper.make_node('MatMul', ['input', 'w1'], ['matmul1_out'])
    # Add bias1
    add1 = helper.make_node('Add', ['matmul1_out', 'b1'], ['add1_out'])
    # ReLU
    relu = helper.make_node('Relu', ['add1_out'], ['relu_out'])
    # MatMul(relu_out, w2)
    matmul2 = helper.make_node('MatMul', ['relu_out', 'w2'], ['matmul2_out'])
    # Add bias2
    add2 = helper.make_node('Add', ['matmul2_out', 'b2'], ['output'])
    
    # Graph
    graph = helper.make_graph(
        [matmul1, add1, relu, matmul2, add2],
        'mole_sniper',
        [input_tensor],
        [output_tensor],
        [w1_init, b1_init, w2_init, b2_init]
    )
    
    # Model
    model = helper.make_model(graph, opset_imports=[helper.make_opsetid('', 11)])
    model.ir_version = 7
    
    return model

def main():
    # Create model
    model = create_onnx_model()
    
    # Validate
    onnx.checker.check_model(model)
    print("Model validated successfully!")
    
    # Save
    output_dir = os.path.join(os.path.dirname(__file__), "..", "public", "models")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "mole_sniper.onnx")
    
    onnx.save(model, output_path)
    print(f"ONNX model saved to: {output_path}")
    
    # Verify file size
    size_kb = os.path.getsize(output_path) / 1024
    print(f"Model size: {size_kb:.1f} KB")

if __name__ == "__main__":
    main()
