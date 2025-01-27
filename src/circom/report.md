## BigAdd

- **BigAdd CS Summary:** { 'Total rows': **2230**, RangeCheck0: 72, Generic: 2158 }

  - BigInt addition is inefficient here because it uses bit serialization instead of range checks in o1js.
  - Integrity testing works well.

- **After Optimization:**

  By using o1js range comparators instead of serializing bits and operating on the overflowing bits for comparisons, the function has become **3.86×** more efficient.

  - **BigAdd CS Summary:**

    - 'Total rows': **577**
    - RangeCheck0: 216
    - Generic: 91
    - RangeCheck1: 72
    - Zero: 126
    - ForeignFieldAdd: 72

  - This demonstrates that o1js range checks are more efficient than those in Circom.

  - Although improved, this implementation is still less efficient than the optimized o1js version, which uses a different algorithm and optimizes carry computations through witnessing.

    - **Add CS Summary:** { 'Total rows': **207**, RangeCheck0: 144, Generic: 63 }

## BigSub

- Assumes `a >= b`.
- **BigSub CS Summary:**

  - 'Total rows': **1071**
  - RangeCheck0: 390
  - Generic: 133
  - RangeCheck1: 159
  - Zero: 265
  - ForeignFieldAdd: 124

- **Optimization in o1js:**

  A vanilla BigInt subtraction implementation in o1js is slightly more efficient but doesn't meet desired efficiency levels.

  - **Sub CS Summary:**

    - 'Total rows': **720**
    - RangeCheck0: 288
    - Generic: 162
    - RangeCheck1: 72
    - Zero: 126
    - ForeignFieldAdd: 72

  - **After Optimization:**

    By witnessing and asserting the borrow, the implementation is optimized by **2.5×**.

    - **Sub CS Summary:** { 'Total rows': **287**, RangeCheck0: 144, Generic: 143 }

## BigSubModP

- Uses one `bigSub` and one `bigAdd`.
- This function is tested and works seamlessly.
- Assumes that `a, b < p` to calculate `(a - b) % p`.
- **BigSubModP CS Summary:**
  - 'Total rows': **1638**
  - RangeCheck0: 570
  - Generic: 250
  - RangeCheck1: 231
  - Zero: 391
  - ForeignFieldAdd: 196

## BigMult

- **Issues Before Fix:**

  - Returned incorrect values because:

    - `BigInt(1 << k)` caused overflow in JS values, leading to inconsistencies in utility functions.
    - Converting Circom's `multiplicative inverse` to integer division quotient led to assertion errors.

  - **Constraint Summary Before Fix:**
    - 'Total rows': **5,732**

- **After Fix:**

  Fixed range checks, making the multiply function efficient and seamless.

  - **Constraint Summary After Fix:**
    - 'Total rows': **1,702**
    - RangeCheck0: 212
    - Generic: 1,280
    - RangeCheck1: 70
    - Zero: 105
    - ForeignFieldAdd: 35

## BigMod

- `BigMod` is implemented for `BigMultModP` and `BigModInv`.
- **Before Optimization:**

  - **BigMod CS Summary:**
    - 'Total rows': **7,926**
    - RangeCheck0: 740
    - Generic: 6,016
    - RangeCheck1: 334
    - Zero: 557
    - ForeignFieldAdd: 279

- **After Optimization:**

  Replaced `toBits(n)` with `rangeCheck116`.

  - **BigMod CS Summary:**
    - 'Total rows': **3,742**
    - RangeCheck0: 812
    - Generic: 1,760
    - RangeCheck1: 334
    - Zero: 557
    - ForeignFieldAdd: 279

- **Impact:**  
  Based on this optimization, the `BigMultModP` and `BigModInv` functions also benefit from increased efficiency.

## BigMultModP

- **Functionality:**

  - A naive composition of one `BigMult` and one `BigMod` operation.
  - Efficiency depends on both underlying functions.
  - Does not utilize any additional optimized algorithms for enhanced efficiency.
  - This function is tested and works seamlessly!

- **BigMultMod CS Summary:**
  - 'Total rows': **5,400**
  - RangeCheck0: 988
  - Generic: 3,032
  - RangeCheck1: 404
  - Zero: 662
  - ForeignFieldAdd: 314

## BigModInv

- **Functionality:**

  - Outputs the multiplicative inverse mod `p` of a bigint.
  - Primarily uses one `BigMult` and one `BigMod` after witnessing the multiplicative inverse.

- **Issues Before Optimization:**

  - Utilized inefficient bit-serializing range checks, making it less efficient.

  - **BigModInv CS Summary Before Optimization:**
    - 'Total rows': **7,479**
    - RangeCheck0: 988
    - Generic: 5,111
    - RangeCheck1: 404
    - Zero: 662
    - ForeignFieldAdd: 314

- **After Optimization:**

  Replaced inefficient range checks with `rangeCheck116`, reducing constraints significantly.

  - **BigModInv CS Summary After Optimization:** { 'Total rows': **5,445** }

## Conclusion

- **Efficiency Comparison:**

  From the study of the `circom-bigint` implementation, it is evident that o1js is generally more efficient, primarily because o1js offers more efficient range checks than Circom.

  - **o1js Advantages:**

    - Uses custom gates to optimize constraints for various operations.
    - Leverages recursion to enable proof composability, allowing provable code to be modularized into external ZkProgram proofs.
    - **Note:** Inefficiencies in certain functions stem from using different algorithms and are not directly related to Circom.

  - **Comparison Challenges:**
    - Conducting a constraint-based comparison is difficult due to differing proof systems:
      - o1js is Plonkish.
      - Circom is R1CS.

- **Insights from Conversion:**

  - **Witnessing Operations:**

    - **o1js:**

      - Witnessing operations in TypeScript is easier, more readable, and straightforward, allowing the use of TypeScript within the witness callback.

    - **Circom:**

      - Limited syntax makes witnessing less readable and more tedious.
      - Requires operations within a field environment, such as witnessing the multiplicative inverse, which involves handling limbs even when witnessed and requires tailoring verbose utilities manually.

  - **Writing Provable Code:**

    - **o1js:**

      - Leverages TypeScript methods when operating on arrays of fields (e.g., `.map`, `.reduce`, array assignments).
      - Supports composite provable types like `Struct`.

    - **Circom:**
      - Requires manual assignment and processing of field arrays within loops, making it less readable and more labor-intensive.
      - Recently introduced `Buses`, similar to `Struct` in o1js, but the developer experience (DevX) in o1js remains superior.
