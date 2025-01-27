import { assert, Field, Provable } from 'o1js';

export { splitFn, splitThreeFn, long_div, mod_inv, log2Ceil };

function splitFn(input: Field, n: number, m: number) {
  const res = Provable.witness(Provable.Array(Field, 3), () => {
    return [
      input.toBigInt() % (1n << BigInt(n)),
      (input.toBigInt() / (1n << BigInt(n))) % (1n << BigInt(m)),
    ].map(Field);
  });
  return res;
}

function splitThreeFn(input: Field, n: number, m: number, k: number) {
  const res = Provable.witness(Provable.Array(Field, 3), () => {
    return [
      input.toBigInt() % (1n << BigInt(n)),
      (input.toBigInt() / (1n << BigInt(n))) % (1n << BigInt(m)),
      (input.toBigInt() / (1n << BigInt(n + m))) % (1n << BigInt(k)),
    ];
  });
  return res;
}

// a is a n-bit scalar
// b has k registers
function long_scalar_mult(n: number, k: number, a: bigint, b: bigint[]) {
  let out = Array.from({ length: 100 }, () => 0n);

  for (let i = 0; i < k; i++) {
    let ab = a * b[i];
    const temp = ab + out[i];
    out[i] = temp % (1n << BigInt(n));
    out[i + 1] = out[i + 1] + temp / (1n << BigInt(n));
  }

  return out;
}

// n bits per register
// a has k registers
// b has k registers
// a >= b
function long_sub(n: number, k: number, a: bigint[], b: bigint[]) {
  let diff: bigint[] = [];
  let borrow: bigint[] = [];

  for (let i = 0; i < k; i++) {
    if (i == 0) {
      if (a[i] >= b[i]) {
        diff[i] = a[i] - b[i];
        borrow[i] = 0n;
      } else {
        diff[i] = a[i] - b[i] + (1n << BigInt(n));
        borrow[i] = 1n;
      }
    } else {
      if (a[i] >= b[i] + borrow[i - 1]) {
        diff[i] = a[i] - b[i] - borrow[i - 1];
        borrow[i] = 0n;
      } else {
        diff[i] = 1n << (BigInt(n) + a[i] - b[i] - borrow[i - 1]);
        borrow[i] = 1n;
      }
    }
  }
  return diff;
}

// 1 if true, 0 if false
function long_gt(n: number, k: number, a: bigint[], b: bigint[]) {
  for (let i = k - 1; i >= 0; i--) {
    if (a[i] > b[i]) {
      return 1;
    }
    if (a[i] < b[i]) {
      return 0;
    }
  }
  return 0;
}

// n bits per register
// a has k + 1 registers
// b has k registers
// assumes leading digit of b is at least 2 ** (n - 1)
// 0 <= a < (2**n) * b
function short_div_norm(n: number, k: number, a: bigint[], b: bigint[]) {
  let qhat = (a[k] * (1n << BigInt(n)) + a[k - 1]) / b[k - 1];
  if (qhat > (1n << BigInt(n)) - 1n) {
    qhat = (1n << BigInt(n)) - 1n;
  }

  let mult = long_scalar_mult(n, k, qhat, b);
  if (long_gt(n, k + 1, mult, a) == 1) {
    mult = long_sub(n, k + 1, mult, b);
    if (long_gt(n, k + 1, mult, a) == 1) {
      return qhat - 2n;
    } else {
      return qhat - 1n;
    }
  } else {
    return qhat;
  }
}

// n bits per register
// a has k + 1 registers
// b has k registers
// assumes leading digit of b is non-zero
// 0 <= a < (2**n) * b
function short_div(n: number, k: number, a: bigint[], b: bigint[]) {
  let scale = (1n << BigInt(n)) / (1n + b[k - 1]);

  // k + 2 registers now
  let norm_a = long_scalar_mult(n, k + 1, scale, a);
  // k + 1 registers now
  let norm_b = long_scalar_mult(n, k, scale, b);

  let ret;
  if (norm_b[k] != 0n) {
    ret = short_div_norm(n, k + 1, norm_a, norm_b);
  } else {
    ret = short_div_norm(n, k, norm_a, norm_b);
  }
  return ret;
}

// n bits per register
// a has k + m registers
// b has k registers
// out[0] has length m + 1 -- quotient
// out[1] has length k -- remainder
// implements algorithm of https://people.eecs.berkeley.edu/~fateman/282/F%20Wright%20notes/week4.pdf
function long_div(n: number, k: number, m: number, a: Field[], b: Field[]) {
  // let out: bigint[][] = [];
  let out = Array.from({ length: 2 }, () =>
    Array.from({ length: 100 }, () => 0n)
  );
  const a_big = a.map((f) => f.toBigInt());
  const b_big = b.map((f) => f.toBigInt());
  m += k;
  while (b_big[k - 1] == 0n) {
    out[1][k] = 0n;
    k--;
    assert(k > 0);
  }
  m -= k;

  let remainder: bigint[] = [];
  for (let i = 0; i < m + k; i++) {
    remainder[i] = a_big[i];
  }

  // let mult: bigint[] = [];
  let dividend: bigint[] = [];
  for (let i = m; i >= 0; i--) {
    if (i == m) {
      dividend[k] = 0n;
      for (let j = k - 1; j >= 0; j--) {
        dividend[j] = remainder[j + m];
      }
    } else {
      for (let j = k; j >= 0; j--) {
        dividend[j] = remainder[j + i];
      }
    }

    out[0][i] = short_div(n, k, dividend, b_big);

    let mult_shift = long_scalar_mult(n, k, out[0][i], b_big);
    let subtrahend: bigint[] = [];
    for (let j = 0; j < m + k; j++) {
      subtrahend[j] = 0n;
    }
    for (let j = 0; j <= k; j++) {
      if (i + j < m + k) {
        subtrahend[i + j] = mult_shift[j];
      }
    }
    //TODO make long_sub generic
    remainder = long_sub(n, m + k, remainder, subtrahend);
  }
  for (let i = 0; i < k; i++) {
    out[1][i] = remainder[i];
  }
  out[1][k] = 0n;

  return out;
}

// n bits per register
// a and b both have k registers
// out[0] has length 2 * k
// adapted from BigMulShortLong and LongToShortNoEndCarry2 witness computation
function prod(n: number, k: number, a: bigint[], b: bigint[]) {
  // first compute the intermediate values. taken from BigMulShortLong
  let prod_val = Array.from({ length: 2 * k - 1 }, () => 0n);
  for (let i = 0; i < 2 * k - 1; i++) {
    if (i < k) {
      for (let a_idx = 0; a_idx <= i; a_idx++) {
        prod_val[i] = prod_val[i] + a[a_idx] * b[i - a_idx];
      }
    } else {
      for (let a_idx = i - k + 1; a_idx < k; a_idx++) {
        prod_val[i] = prod_val[i] + a[a_idx] * b[i - a_idx];
      }
    }
  }

  // now do a bunch of carrying to make sure registers not overflowed. taken from LongToShortNoEndCarry2
  let out: bigint[] = []; // length is 2 * k

  let split: bigint[][] = []; // first dimension has length 2 * k - 1
  for (let i = 0; i < 2 * k - 1; i++) {
    split[i] = splitThreeFn(Field(prod_val[i]), n, n, n).map((f) =>
      f.toBigInt()
    );
  }

  let carry: bigint[] = []; // length is 2 * k - 1
  carry[0] = 0n;
  out[0] = split[0][0];
  if (2 * k - 1 > 1) {
    let sumAndCarry = splitFn(Field(split[0][1] + split[1][0]), n, n);

    out[1] = sumAndCarry[0].toBigInt();
    carry[1] = sumAndCarry[1].toBigInt();
  }
  if (2 * k - 1 > 2) {
    for (let i = 2; i < 2 * k - 1; i++) {
      let sumAndCarry = splitFn(
        Field(split[i][0] + split[i - 1][1] + split[i - 2][2] + carry[i - 1]),
        n,
        n
      );
      out[i] = sumAndCarry[0].toBigInt();
      carry[i] = sumAndCarry[1].toBigInt();
    }
    out[2 * k - 1] =
      split[2 * k - 2][1] + split[2 * k - 3][2] + carry[2 * k - 2];
  }
  return out;
}

// n bits per register
// a has k registers
// p has k registers
// e has k registers
// k * n <= 500
// p is a prime
// computes a^e mod p
function mod_exp(n: number, k: number, a: bigint[], p: bigint[], e: bigint[]) {
  let eBits: bigint[] = []; // length is k * n
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < n; j++) {
      eBits[j + n * i] = (e[i] >> BigInt(j)) & 1n;
    }
  }

  let out: bigint[] = []; // length is k
  for (let i = 0; i < 100; i++) {
    out[i] = 0n;
  }
  out[0] = 1n;

  // repeated squaring
  for (let i = k * n - 1; i >= 0; i--) {
    // multiply by a if bit is 0
    if (eBits[i] == 1n) {
      let temp = prod(n, k, out, a).map(Field); // length 2 * k
      temp = prod(n, k, out, a).map(Field);
      let temp2 = long_div(n, k, k, temp, p.map(Field));
      out = temp2[1];
    }

    // square, unless we're at the end
    if (i > 0) {
      let temp = prod(n, k, out, out);
      let temp2 = long_div(n, k, k, temp.map(Field), p.map(Field));
      out = temp2[1];
    }
  }
  return out;
}

// n bits per register
// a has k registers
// p has k registers
// k * n <= 500
// p is a prime
// if a == 0 mod p, returns 0
// else computes inv = a^(p-2) mod p
function mod_inv(n: number, k: number, a: bigint[], p: bigint[]) {
  let isZero = 1n;
  for (let i = 0; i < k; i++) {
    if (a[i] != 0n) {
      isZero = 0n;
    }
  }
  //TODO refactor
  if (isZero == 1n) {
    let ret = [];
    for (let i = 0; i < k; i++) {
      ret[i] = 0;
    }
    return ret;
  }

  let pCopy: bigint[] = [];
  for (let i = 0; i < 100; i++) {
    if (i < k) {
      pCopy[i] = p[i];
    } else {
      pCopy[i] = 0n;
    }
  }

  let two: bigint[] = [];
  for (let i = 0; i < 100; i++) {
    two[i] = 0n;
  }
  two[0] = 2n;

  let pMinusTwo: bigint[] = [];
  pMinusTwo = long_sub(n, k, pCopy, two); // length k
  let out: bigint[] = [];
  out = mod_exp(n, k, a, pCopy, pMinusTwo);

  return out;
}

function log2Ceil(a: number): number {
  return Math.ceil(Math.log2(a));
}
