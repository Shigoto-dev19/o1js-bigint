import json
import matplotlib.pyplot as plt

with open("benchmark_results.json", "r") as f:
    data = json.load(f)

print("Sample data structure:", data[0])

sizes = [d['size'] for d in data]
modMul_total_rows = [d['modMul']['Total rows'] for d in data]
modSquare_total_rows = [d['modSquare']['Total rows'] for d in data]
assertEqual_total_rows = [d['assertEqual']['Total rows'] for d in data]
rsaVerify_total_rows = [d['rsaVerify']['Total rows'] for d in data]

# Helper function to annotate points of interest (1024 and 2048 bit size)
def annotate_points(ax, sizes, rows, label):
    for point in [1024, 2048]:
        if point in sizes:
            idx = sizes.index(point)
            x_val = sizes[idx]
            y_val = rows[idx]
            ax.annotate(
                f"{y_val}",
                xy=(x_val, y_val),
                xytext=(0, 8),
                textcoords="offset points",
                ha='center',
                fontsize=10,
                fontweight='bold',
                arrowprops=dict(arrowstyle="->", color='black', lw=1)
            )

fig, axs = plt.subplots(2, 2, figsize=(12, 10))

# ModMul
axs[0, 0].plot(sizes, modMul_total_rows, marker='o', color='blue')
axs[0, 0].set_title('ModMul: Total Rows vs. Bit Size', fontsize=14)
axs[0, 0].set_xlabel('Bit Size', fontsize=12)
axs[0, 0].set_ylabel('Total Rows', fontsize=12)
axs[0, 0].grid(True)
annotate_points(axs[0, 0], sizes, modMul_total_rows, 'ModMul')

# ModSquare
axs[0, 1].plot(sizes, modSquare_total_rows, marker='^', color='green')
axs[0, 1].set_title('ModSquare: Total Rows vs. Bit Size', fontsize=14)
axs[0, 1].set_xlabel('Bit Size', fontsize=12)
axs[0, 1].set_ylabel('Total Rows', fontsize=12)
axs[0, 1].grid(True)
annotate_points(axs[0, 1], sizes, modSquare_total_rows, 'ModSquare')

# AssertEqual
axs[1, 0].plot(sizes, assertEqual_total_rows, marker='s', color='red')
axs[1, 0].set_title('AssertEquals: Total Rows vs. Bit Size', fontsize=14)
axs[1, 0].set_xlabel('Bit Size', fontsize=12)
axs[1, 0].set_ylabel('Total Rows', fontsize=12)
axs[1, 0].grid(True)
annotate_points(axs[1, 0], sizes, assertEqual_total_rows, 'AssertEquals')

# RSA65537
axs[1, 1].plot(sizes, rsaVerify_total_rows, marker='d', color='purple')
axs[1, 1].set_title('RSA65537: Total Rows vs. Bit Size', fontsize=14)
axs[1, 1].set_xlabel('Bit Size', fontsize=12)
axs[1, 1].set_ylabel('Total Rows', fontsize=12)
axs[1, 1].grid(True)
annotate_points(axs[1, 1], sizes, rsaVerify_total_rows, 'RSA65537')

plt.tight_layout()
plt.show()
