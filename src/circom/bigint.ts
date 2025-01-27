import { assert, Bool, Field, Provable } from 'o1js';
import { long_div, mod_inv, splitFn, splitThreeFn, log2Ceil } from './utils.js';
import { Bigint2048, modInverse, rangeCheck116 } from '../bigint.js';

export {
  fromFields,
  unsafeFromLimbs,
  bigAdd,
  bigSub,
  bigSubModP,
  bigMult,
  bigMod,
  bigMultModP,
  bigModInv,
  bigLessThan,
  bigIsEqual,
};

//todo remove unused functions
//todo remove
function fromFields(fields: Field[], n: number, k: number): bigint {
  let result = 0n;
  const shiftFactor = BigInt(k);

  for (let i = 0; i < n; i++) {
    const fieldValue = fields[i].toBigInt();
    result |= fieldValue << (shiftFactor * BigInt(i));
  }

  return result;
}

function unsafeFromLimbs(fields: Field[], n: number, k: number) {
  assert(fields.length === k, `expected ${k} limbs`);
  let value = 0n;
  for (let i = k - 1; i >= 0; i--) {
    value <<= BigInt(n);
    value += fields[i]!.toBigInt();
  }
  return value;
}

// addition mod 2**n with carry bit
function modSum(a: Field, b: Field, n: number) {
  assert(n <= 252);
  const limbSize = 1n << BigInt(n);
  const ab = a.add(b);

  const carry = ab.greaterThan(limbSize).toField();
  const sum = ab.sub(carry.mul(limbSize));

  return { carry, sum };
}

// a - b
function modSub(a: Field, b: Field, n: number) {
  assert(n <= 252);

  const borrow = a.lessThan(b).toField();
  const out = a.sub(b).add(borrow.mul(1n << BigInt(n)));

  return { borrow, out };
}

// a - b - c
// assume a - b - c + 2 ** n >= 0
function modSubThree(a: Field, b: Field, c: Field, n: number) {
  assert(n + 2 <= 253);
  a.sub(b)
    .sub(c)
    .add(1n << BigInt(n))
    .assertGreaterThanOrEqual(0);

  const b_plus_c = b.add(c);
  const borrow = a.lessThan(b_plus_c).toField();

  const out = a.sub(b_plus_c).add(borrow.mul(1n << BigInt(n)));

  return { borrow, out };
}

function modSumThree(a: Field, b: Field, c: Field, n: number) {
  assert(n + 2 <= 253);
  const limbSize = 1n << BigInt(n);

  const abc = a.add(b).add(c);
  // const bits = abc.toBits(n + 2);
  const carry = abc.greaterThan(limbSize).toField();

  // const carry = bits[n].toField().add(bits[n + 1].toField().mul(2));
  const sum = abc.sub(carry.mul(limbSize));

  return { carry, sum };
}

function modSumFour(a: Field, b: Field, c: Field, d: Field, n: number) {
  assert(n + 2 <= 253);
  const bits = a
    .add(b)
    .add(c)
    .add(d)
    .toBits(n + 2);
  const carry = bits[n].toField().add(bits[n + 1].toField().mul(2));
  const sum = a
    .add(b)
    .add(c)
    .add(d)
    .sub(carry.mul(1 << n));

  return { carry, sum };
}

// product mod 2 ** n with carry
function modProd(a: Field, b: Field, n: number) {
  assert(n <= 126);
  const bits = a.mul(b).toBits(2 * n);
  const prod = Field.fromBits(bits.slice(0, n));
  const carry = Field.fromBits(bits.slice(n, 2 * n));

  return { carry, prod };
}

// // split n + m bit input into two outputs
// function split(input: Field, n: number, m: number) {
//   assert(n <= 126);

//   const small = Provable.witness(Field, () => {
//     const res = input.toBigInt() % BigInt(1 << n);
//     return Field(res);
//   });

//   const big = Provable.witness(Field, () => {
//     const res = input.toBigInt() / BigInt(1 << n);
//     return Field(res);
//   });

//   const small_bits = small.toBits(n);
//   const big_bits = big.toBits(m);

//   input.assertEquals(small.add(big.mul(1 << n)));

//   return { small, big };
// }

function splitThree(input: Field, n: number, m: number, k: number) {
  assert(n <= 126);

  const small = Provable.witness(Field, () => {
    const res = input.toBigInt() % BigInt(1 << n);
    return Field(res);
  });

  const medium = Provable.witness(Field, () => {
    const res = (input.toBigInt() / BigInt(1 << n)) % BigInt(1 << m);
    return Field(res);
  });

  const big = Provable.witness(Field, () => {
    const res = input.toBigInt() / BigInt(1 << (n + m));
    return Field(res);
  });

  const small_bits = small.toBits(n);
  const medium_bits = medium.toBits(m);
  const big_bits = big.toBits(k);

  input.assertEquals(small.add(medium.mul(1 << n)).add(big.mul(1 << (n + m))));

  return { small, medium, big };
}

// a[i], b[i] in 0... 2**n-1
// represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
function bigAdd(a: Field[], b: Field[], n: number, k: number) {
  assert(n <= 252);
  let unit: ReturnType<typeof modSumThree>[] = [];
  let out: Field[] = [];

  const unit_0 = modSum(a[0], b[0], n);
  out[0] = unit_0.sum;

  let c: Field;
  for (let i = 1; i < k; i++) {
    c = i === 1 ? unit_0.carry : unit[i - 2].carry;

    unit[i - 1] = modSumThree(a[i], b[i], c, n);
    out[i] = unit[i - 1].sum;
  }
  out[k] = unit[k - 2].carry;

  return out;
}

// a[i], b[i] in 0... 2**n-1
// represent a = a[0] + a[1] * 2**n + .. + a[k - 1] * 2**(n * k)
// assume a >= b
function bigSub(a: Field[], b: Field[], n: number, k: number) {
  assert(n <= 252);

  const unit0 = modSub(a[0], b[0], n);
  let unit: ReturnType<typeof modSubThree>[] = [];
  let out: Field[] = [unit0.out];

  for (let i = 1; i < k; i++) {
    if (i == 1) {
      unit[i - 1] = modSubThree(a[i], b[i], unit0.borrow, n);
    } else {
      unit[i - 1] = modSubThree(a[i], b[i], unit[i - 2].borrow, n);
    }
    out[i] = unit[i - 1].out;
  }
  const underflow = unit[k - 2].borrow;

  return { out, underflow };
}

// calculates (a - b) % p, where a, b < p
// note: does not assume a >= b
function bigSubModP(a: Field[], b: Field[], p: Field[], n: number, k: number) {
  assert(n <= 252);

  const sub = bigSub(a, b, n, k);
  const flag = sub.underflow;
  const out = bigAdd(
    sub.out,
    p.map((f) => f.mul(flag)),
    n,
    k
  );

  return out.slice(0, k);
}

// in[i] contains longs
// out[i] contains shorts
function longToShortNoEndCarry(input: Field[], n: number, k: number) {
  assert(n <= 126);
  let out: Field[] = [];

  let split: Field[][] = [];
  for (let i = 0; i < k; i++) {
    split[i] = splitThreeFn(input[i], n, n, n).map(Field);
  }

  let carry: Field[] = [];
  carry[0] = Field(0);
  out[0] = split[0][0];

  if (k === 1) out[1] = split[0][1];
  if (k > 1) {
    let sumAndCarry = splitFn(split[0][1].add(split[1][0]), n, n);
    out[1] = sumAndCarry[0];
    carry[1] = sumAndCarry[1];
  }
  if (k == 2) {
    out[2] = split[1][1].add(split[0][2]).add(carry[1]);
  }
  if (k > 2) {
    for (let i = 2; i < k; i++) {
      let sumAndCarry = splitFn(
        split[i][0]
          .add(split[i - 1][1])
          .add(split[i - 2][2])
          .add(carry[i - 1]),
        n,
        n
      );
      out[i] = sumAndCarry[0];
      carry[i] = sumAndCarry[1];
    }
    out[k] = split[k - 1][1].add(split[k - 2][2]).add(carry[k - 1]);
  }

  let runningCarry: Field[] = [];
  runningCarry[0] = Provable.witness(Field, () => {
    const w = input[0].sub(out[0]).div(1n << BigInt(n));
    return Field(w);
  });

  // let runningCarryBits = runningCarry[0].toBits(n + log_ceil(k));
  runningCarry[0].assertLessThan(1n << BigInt(n + log2Ceil(k)));
  runningCarry[0].mul(1n << BigInt(n)).assertEquals(input[0].sub(out[0]));
  for (let i = 1; i < k; i++) {
    runningCarry[i] = Provable.witness(Field, () => {
      const w = input[i]
        .sub(out[i])
        .add(runningCarry[i - 1])
        .div(1n << BigInt(n));
      return Field(w);
    });
    // runningCarryBits = runningCarry[i].toBits(n + log_ceil(k));
    runningCarry[i].assertLessThan(1n << BigInt(n + log2Ceil(k)));

    runningCarry[i]
      .mul(1n << BigInt(n))
      .assertEquals(input[i].sub(out[i]).add(runningCarry[i - 1]));
  }
  runningCarry[k - 1].assertEquals(out[k]);

  return out;
}

// a and b have n-bit registers
// a has ka registers, each with NONNEGATIVE ma-bit values (ma can be > n)
// b has kb registers, each with NONNEGATIVE mb-bit values (mb can be > n)
// out has ka + kb - 1 registers, each with (ma + mb + ceil(log(max(ka, kb))))-bit values
function bigMultNoCarry(
  a: Field[],
  b: Field[],
  n: number,
  ma: number,
  mb: number,
  ka: number,
  kb: number
) {
  assert(ma + mb <= 253);

  const out: Field[] = Provable.witness(
    Provable.Array(Field, ka + kb - 1),
    () => {
      let prod_val: Field[] = Array.from({ length: ka + kb - 1 }, () =>
        Field(0)
      );
      for (let i = 0; i < ka; i++) {
        for (let j = 0; j < kb; j++) {
          prod_val[i + j] = prod_val[i + j].add(a[i].mul(b[j]));
        }
      }
      let res: Field[] = [];
      for (let i = 0; i < ka + kb - 1; i++) {
        res[i] = prod_val[i];
      }
      return res;
    }
  );

  let a_poly: Field[] = [];
  let b_poly: Field[] = [];
  let out_poly: Field[] = [];

  for (let i = 0; i < ka + kb - 1; i++) {
    out_poly[i] = Field(0);
    a_poly[i] = Field(0);
    b_poly[i] = Field(0);

    for (let j = 0; j < ka + kb - 1; j++) {
      out_poly[i] = out_poly[i].add(out[j].mul(i ** j));
    }

    for (let j = 0; j < ka; j++) {
      a_poly[i] = a_poly[i].add(a[j].mul(i ** j));
    }

    for (let j = 0; j < kb; j++) {
      b_poly[i] = b_poly[i].add(b[j].mul(i ** j));
    }
  }

  for (let i = 0; i < ka + kb - 1; i++) {
    out_poly[i].assertEquals(a_poly[i].mul(b_poly[i]));
  }

  return out;
}

function bigMult(a: Field[], b: Field[], n: number, k: number) {
  const multNoCarry = bigMultNoCarry(a, b, n, n, n, k, k);
  const longshort = longToShortNoEndCarry(multNoCarry, n, 2 * k - 1);

  return longshort;
}

// leading register of b should be non-zero
function bigMod(a: Field[], b: Field[], n: number, k: number) {
  assert(n <= 126);
  let div = Provable.witness(Provable.Array(Field, k + 1), () => {
    let longdiv = long_div(n, k, k, a, b);
    return longdiv[0].slice(0, k + 1).map(Field);
  });

  let mod = Provable.witness(Provable.Array(Field, k), () => {
    let longdiv = long_div(n, k, k, a, b);
    return longdiv[1].slice(0, k).map(Field);
  });

  for (let i = 0; i < k; i++) {
    rangeCheck116(div[i]);
    rangeCheck116(mod[i]);
  }

  let mul = bigMult(div, b.concat(Field(0)), n, k + 1);
  let add = bigAdd(
    mul,
    mod.concat(Array.from({ length: k + 2 }, () => Field(0))),
    n,
    2 * k + 2
  );

  for (let i = 0; i < 2 * k; i++) {
    add[i].assertEquals(a[i]);
  }

  add[2 * k].assertEquals(0);
  add[2 * k + 1].assertEquals(0);

  const lt = bigLessThan(mod, b, n, k);

  lt.assertTrue();

  return { div, mod };
}

function bigMultModP(a: Field[], b: Field[], p: Field[], n: number, k: number) {
  assert(n <= 252);

  const big_mult = bigMult(a, b, n, k);
  const big_mod = bigMod(big_mult, p, n, k);

  return big_mod;
}

function bigModInv(input: Field[], p: Field[], n: number, k: number) {
  assert(n <= 252);
  let inv = Provable.witness(Provable.Array(Field, k), () => {
    const input_big = input.map((f) => f.toBigInt());
    const p_big = p.map((f) => f.toBigInt());

    return mod_inv(n, k, input_big, p_big).map(Field);
  });

  let out = inv.slice(0, k);
  out.map((f) => rangeCheck116(f));

  const mult = bigMult(input, out, n, k);
  const mod = bigMod(mult, p, n, k);

  mod.mod[0].assertEquals(1);
  for (let i = 1; i < k; i++) {
    mod.mod[i].assertEquals(0);
  }

  return out;
}

function bigLessThan(a: Field[], b: Field[], n: number, k: number) {
  let lt: Bool[] = [];
  let eq: Bool[] = [];

  for (let i = 0; i < k; i++) {
    lt[i] = a[i].lessThan(b[i]);
    eq[i] = a[i].equals(b[i]);
  }

  // ors[i] holds (lt[k - 1] || (eq[k - 1] && lt[k - 2]) .. || (eq[k - 1] && .. && lt[i]))
  // ands[i] holds (eq[k - 1] && .. && lt[i])
  // eq_ands[i] holds (eq[k - 1] && .. && eq[i])

  let ands: Bool[] = [];
  let eq_ands: Bool[] = [];
  let ors: Bool[] = [];
  for (let i = k - 2; i >= 0; i--) {
    if (i == k - 2) {
      ands[i] = eq[k - 1].and(lt[k - 2]);
      eq_ands[i] = eq[k - 1].and(eq[k - 2]);
      ors[i] = lt[k - 1].or(ands[i]);
    } else {
      ands[i] = eq_ands[i + 1].and(lt[i]);
      eq_ands[i] = eq[k - 1].and(eq[i]);
      ors[i] = ors[i + 1].or(ands[i]);
    }
  }
  return ors[0];
}

function bigIsEqual(a: Field[], b: Field[], k: number) {
  let sum = Field(0);

  for (let i = 0; i < k; i++) {
    sum = sum.add(a[i].equals(b[i]).toField());
  }

  return sum.equals(k);
}

// in[i] contains values in the range -2^(m-1) to 2^(m-1)
// constrain that in[] as a big integer is zero
// each limbs is n bits
function CheckCarryToZero(input: Field[], n: number, m: number, k: number) {
  assert(k >= 2);
  assert(m + 3 <= 253);

  let carry: Field[] = [];
  for (let i = 0; i < k - 1; i++) {
    if (i == 0) {
      carry[i] = Provable.witness(Field, () => {
        return input[i].toBigInt() / BigInt(1 << n);
      });
      input[i].assertEquals(carry[i].mul(1 << n));
    } else {
      carry[i] = Provable.witness(Field, () => {
        return input[i].add(carry[i - 1]).toBigInt() / BigInt(1 << n);
      });
      input[i].add(carry[i - 1]).assertEquals(carry[i].mul(1 << n));
    }
    // checking carry is in the range of - 2^(m-n-1+eps), 2^(m+-n-1+eps)
    carry[i].add(1 << (m + 3 - n - 1)).toBits(m + 3 - n);
  }
  input[k - 1].add(carry[k - 2]).assertEquals(0);
}
