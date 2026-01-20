"""
MoleSniper AI Training Script
Generates synthetic data and trains a small MLP to predict optimal leaf scatter locations.

Usage:
    python scripts/train_mole_sniper.py

Output:
    public/models/mole_sniper.onnx
"""

import os
import math
import random
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader

# --- Constants (matching TypeScript implementation) ---
GRID_COLS = 20
GRID_ROWS = 16
CELL_SIZE = 1.5  # meters
BOUNDS_X = (105, 135)  # Stage 5 X bounds
BOUNDS_Z = (-12, 12)   # Stage 5 Z bounds
MIN_DIST = 4.0
MAX_DIST = 9.0
CONE_HALF_ANGLE = 55  # degrees

INPUT_SIZE = GRID_COLS * GRID_ROWS + 4  # 320 + 2 (pos) + 2 (dir) = 324
OUTPUT_SIZE = GRID_COLS * GRID_ROWS      # 320 cells

# --- Model Definition ---
class MoleSniperMLP(nn.Module):
    def __init__(self, input_size=INPUT_SIZE, hidden_size=128, output_size=OUTPUT_SIZE):
        super().__init__()
        self.fc1 = nn.Linear(input_size, hidden_size)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_size, output_size)
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        return x

# --- Synthetic Data Generation ---
def cell_to_world(ix: int, iz: int) -> tuple:
    """Convert cell index to world coordinates (center of cell)."""
    world_x = BOUNDS_X[0] + (ix + 0.5) * CELL_SIZE
    world_z = BOUNDS_Z[0] + (iz + 0.5) * CELL_SIZE
    return (world_x, world_z)

def world_to_normalized(x: float, z: float) -> tuple:
    """Normalize world coords to [0, 1] range."""
    u = (x - BOUNDS_X[0]) / (BOUNDS_X[1] - BOUNDS_X[0])
    v = (z - BOUNDS_Z[0]) / (BOUNDS_Z[1] - BOUNDS_Z[0])
    return (u, v)

def is_valid_target(player_x: float, player_z: float, player_fx: float, player_fz: float,
                    cell_x: float, cell_z: float) -> bool:
    """Check if a cell is a valid target based on distance and cone constraints."""
    dx = cell_x - player_x
    dz = cell_z - player_z
    dist = math.sqrt(dx * dx + dz * dz)
    
    # Distance constraint
    if dist < MIN_DIST or dist > MAX_DIST:
        return False
    
    # Cone constraint
    if dist < 0.01:
        return False
    
    # Normalize direction to cell
    dir_x = dx / dist
    dir_z = dz / dist
    
    # Dot product with player forward direction
    dot = dir_x * player_fx + dir_z * player_fz
    angle = math.degrees(math.acos(max(-1, min(1, dot))))
    
    return angle <= CONE_HALF_ANGLE

def compute_intercept_score(player_x: float, player_z: float, player_fx: float, player_fz: float,
                            cell_x: float, cell_z: float) -> float:
    """
    Compute how well this cell intercepts the player's path.
    Higher score = more directly in front of player.
    """
    dx = cell_x - player_x
    dz = cell_z - player_z
    dist = math.sqrt(dx * dx + dz * dz)
    if dist < 0.01:
        return 0.0
    
    # Dot product = how aligned with player direction
    dir_x = dx / dist
    dir_z = dz / dist
    dot = dir_x * player_fx + dir_z * player_fz
    
    # Prefer cells ahead (dot close to 1) and at mid-range distance
    distance_score = 1.0 - abs(dist - 6.5) / 2.5  # Peak at 6.5m
    intercept_score = dot * distance_score
    
    return max(0, intercept_score)

def generate_sample() -> tuple:
    """
    Generate one training sample.
    Returns: (input_vector, target_cell_index)
    """
    # Random player position within bounds (with margin)
    margin = 2.0
    player_x = random.uniform(BOUNDS_X[0] + margin, BOUNDS_X[1] - margin)
    player_z = random.uniform(BOUNDS_Z[0] + margin, BOUNDS_Z[1] - margin)
    
    # Random player direction (normalized)
    angle = random.uniform(0, 2 * math.pi)
    player_fx = math.cos(angle)
    player_fz = math.sin(angle)
    
    # Generate sparse density map (realistic distribution)
    density_map = np.zeros((GRID_ROWS, GRID_COLS), dtype=np.float32)
    
    # Add some clusters of leaves
    num_clusters = random.randint(3, 8)
    for _ in range(num_clusters):
        cx = random.randint(0, GRID_COLS - 1)
        cz = random.randint(0, GRID_ROWS - 1)
        radius = random.randint(1, 3)
        intensity = random.uniform(0.3, 1.0)
        
        for dx in range(-radius, radius + 1):
            for dz in range(-radius, radius + 1):
                ix = cx + dx
                iz = cz + dz
                if 0 <= ix < GRID_COLS and 0 <= iz < GRID_ROWS:
                    falloff = 1.0 - (abs(dx) + abs(dz)) / (radius * 2 + 1)
                    density_map[iz, ix] += intensity * falloff
    
    # Normalize density map to [0, 1]
    max_density = density_map.max()
    if max_density > 0:
        density_map /= max_density
    
    # Find best target cell
    best_cell = -1
    best_score = -float('inf')
    
    for iz in range(GRID_ROWS):
        for ix in range(GRID_COLS):
            cell_x, cell_z = cell_to_world(ix, iz)
            
            if not is_valid_target(player_x, player_z, player_fx, player_fz, cell_x, cell_z):
                continue
            
            # Compute score: intercept + slight density bonus
            intercept = compute_intercept_score(player_x, player_z, player_fx, player_fz, cell_x, cell_z)
            density_bonus = density_map[iz, ix] * 0.2  # Slight weight for density
            score = intercept + density_bonus
            
            if score > best_score:
                best_score = score
                best_cell = iz * GRID_COLS + ix
    
    # If no valid cell found, pick a random valid one or fallback
    if best_cell == -1:
        valid_cells = []
        for iz in range(GRID_ROWS):
            for ix in range(GRID_COLS):
                cell_x, cell_z = cell_to_world(ix, iz)
                if is_valid_target(player_x, player_z, player_fx, player_fz, cell_x, cell_z):
                    valid_cells.append(iz * GRID_COLS + ix)
        
        if valid_cells:
            best_cell = random.choice(valid_cells)
        else:
            # Fallback: random cell (rare edge case)
            best_cell = random.randint(0, OUTPUT_SIZE - 1)
    
    # Build input vector
    u, v = world_to_normalized(player_x, player_z)
    input_vec = np.concatenate([
        density_map.flatten(),
        np.array([u, v, player_fx, player_fz], dtype=np.float32)
    ])
    
    return input_vec, best_cell

class MoleSniperDataset(Dataset):
    def __init__(self, num_samples=50000):
        self.samples = [generate_sample() for _ in range(num_samples)]
    
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        input_vec, target = self.samples[idx]
        return torch.tensor(input_vec, dtype=torch.float32), torch.tensor(target, dtype=torch.long)

# --- Training ---
def train_model(num_samples=50000, epochs=50, batch_size=256, lr=0.001):
    print(f"Generating {num_samples} synthetic samples...")
    dataset = MoleSniperDataset(num_samples)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    model = MoleSniperMLP()
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    print("Training...")
    for epoch in range(epochs):
        total_loss = 0
        correct = 0
        total = 0
        
        for inputs, targets in dataloader:
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, targets)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item()
            _, predicted = outputs.max(1)
            total += targets.size(0)
            correct += predicted.eq(targets).sum().item()
        
        acc = 100 * correct / total
        avg_loss = total_loss / len(dataloader)
        
        if (epoch + 1) % 10 == 0 or epoch == 0:
            print(f"Epoch {epoch + 1}/{epochs} | Loss: {avg_loss:.4f} | Acc: {acc:.2f}%")
    
    return model

def export_onnx(model, output_path):
    model.eval()
    dummy_input = torch.randn(1, INPUT_SIZE)
    
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    torch.onnx.export(
        model,
        dummy_input,
        output_path,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={'input': {0: 'batch_size'}, 'output': {0: 'batch_size'}},
        opset_version=11
    )
    print(f"ONNX model exported to: {output_path}")

if __name__ == "__main__":
    # Train
    model = train_model(num_samples=50000, epochs=50)
    
    # Export
    output_path = os.path.join(os.path.dirname(__file__), "..", "public", "models", "mole_sniper.onnx")
    export_onnx(model, output_path)
    
    print("Done!")
