import { assert, Field, Gadgets, Provable, Struct, Unconstrained } from 'o1js';
import { inverse, sqrtMod } from './utils.js';

export { Bigint2048, rsaVerify65537, rangeCheck116, fromFields };

//todo return rest and quotient everytime -> new commit
//todo add JSDoc --> new commit

const mask = (1n << 116n) - 1n;

/**
 * We use 116-bit limbs, which means 18 limbs for 2048-bit numbers as used in RSA.
 */
const Field18 = Provable.Array(Field, 18);

class Bigint2048 extends Struct({
  fields: Field18,
  value: Unconstrained.withEmpty(0n),
}) {
  add(x: Bigint2048) {
    const sum = Provable.witness(Bigint2048, () => {
      return Bigint2048.from(this.toBigint() + x.toBigint());
    });

    let delta = Array<Field>(18).fill(Field(0));

    for (let i = 0; i < 18; i++) {
      delta[i] = this.fields[i].add(x.fields[i]);
      delta[i] = delta[i].sub(sum.fields[i]).seal();
    }

    let carry = Field(0);

    for (let i = 0; i < 17; i++) {
      // 17 because we have 18 limbs
      let deltaPlusCarry = delta[i].add(carry).seal();

      carry = Provable.witness(Field, () => deltaPlusCarry.div(1n << 116n));
      rangeCheck128Signed(carry);

      // ensure that after adding the carry, the limb is a multiple of 2^116
      deltaPlusCarry.assertEquals(carry.mul(1n << 116n));
    }

    // the final limb plus carry should be zero to assert correctness
    delta[17].add(carry).assertEquals(0n);

    return sum;
  }

  modAdd(x: Bigint2048, y: Bigint2048) {
    return add(x, y, this, { isDouble: false });
  }

  modDouble(x: Bigint2048) {
    return add(x, x, this, { isDouble: true });
  }

  sub(x: Bigint2048) {
    const diff = Provable.witness(Bigint2048, () => {
      return Bigint2048.from(this.toBigint() - x.toBigint());
    });

    let delta = Array<Field>(18).fill(Field(0));

    for (let i = 0; i < 18; i++) {
      delta[i] = this.fields[i].sub(x.fields[i]);
      delta[i] = delta[i].sub(diff.fields[i]).seal();
    }

    let carry = Field(0);

    for (let i = 0; i < 17; i++) {
      // 17 because we have 18 limbs
      let deltaPlusCarry = delta[i].add(carry).seal();

      carry = Provable.witness(Field, () => deltaPlusCarry.div(1n << 116n));
      rangeCheck128Signed(carry);

      // ensure that after adding the carry, the limb is a multiple of 2^116
      deltaPlusCarry.assertEquals(carry.mul(1n << 116n));
    }

    // the final limb plus carry should be zero to assert correctness
    delta[17].add(carry).assertEquals(0n);

    return diff;
  }

  modSub(x: Bigint2048, y: Bigint2048) {
    // witness q, r so that x-y = q*p + r
    let { q, r } = Provable.witness(
      Struct({ q: Bigint2048, r: Bigint2048 }),
      () => {
        let xMinusY = x.toBigint() - y.toBigint();
        let p0 = this.toBigint();
        let q = xMinusY / p0;
        let r = xMinusY - q * p0;
        return { q: Bigint2048.from(q), r: Bigint2048.from(r) };
      }
    );

    let delta: Field[] = Array.from({ length: 18 }, () => Field(0));
    let [X, Y, Q, R, P] = [x.fields, y.fields, q.fields, r.fields, this.fields];

    // compute X - Y limb-by-limb
    for (let i = 0; i < 18; i++) {
      delta[i] = X[i].sub(Y[i]);
    }

    // subtract q*p limb-by-limb
    for (let i = 0; i < 18; i++) {
      for (let j = 0; j < 18; j++) {
        if (i + j < 18) {
          delta[i + j] = delta[i + j].sub(Q[i].mul(P[j]));
        }
      }
    }

    // subtract r limb-by-limb
    for (let i = 0; i < 18; i++) {
      delta[i] = delta[i].sub(R[i]).seal();
    }

    let carry = Field(0);

    for (let i = 0; i < 17; i++) {
      // 17 because we have 18 limbs
      let deltaPlusCarry = delta[i].add(carry).seal();

      carry = Provable.witness(Field, () => deltaPlusCarry.div(1n << 116n));
      rangeCheck128Signed(carry);

      // ensure that after adding the carry, the limb is a multiple of 2^116
      deltaPlusCarry.assertEquals(carry.mul(1n << 116n));
    }
    // the final limb plus carry should be zero to assert correctness
    delta[17].add(carry).assertEquals(0n);

    return r;
  }

  modMul(x: Bigint2048, y: Bigint2048) {
    return multiply(x, y, this);
  }

  modSquare(x: Bigint2048) {
    return multiply(x, x, this, { isSquare: true });
  }

  // (x ^ e) % this
  modPow(base: Bigint2048, e: bigint) {
    if (e === 0n) {
      return Bigint2048.from(1n); // \(x^0 \mod p = 1\)
    }

    // convert exponent to binary string
    const bits = e.toString(2);
    const bitLength = bits.length;

    let res = Bigint2048.from(1n);
    let started = false; // flag to indicate if we've encountered the first '1' bit

    for (let i = 0; i < bitLength; i++) {
      const bit = bits[i];

      if (!started) {
        if (bit === '1') {
          res = base; // initialize result to base at first '1' bit
          started = true;
        }
        // if bit is '0' and not started, do nothing
      } else {
        res = this.modSquare(res); // always square after the first '1' bit

        if (bit === '1') {
          res = this.modMul(res, base); // multiply by base if bit is '1'
        }
      }
    }

    return res;
  }

  // x % p
  mod(x: Bigint2048) {
    // witness q, r so that x = q*p + r
    let { q, r } = Provable.witness(
      Struct({ q: Bigint2048, r: Bigint2048 }),
      () => {
        let x_big = x.toBigint();
        let p0 = this.toBigint();
        let q = x_big / p0;
        let r = x_big - q * p0;
        return { q: Bigint2048.from(q), r: Bigint2048.from(r) };
      }
    );

    let [X, Q, R, P] = [x.fields, q.fields, r.fields, this.fields];
    let delta: Field[] = X;

    // subtract q*p limb-by-limb
    for (let i = 0; i < 18; i++) {
      for (let j = 0; j < 18; j++) {
        if (i + j < 18) {
          delta[i + j] = delta[i + j].sub(Q[i].mul(P[j]));
        }
      }
    }

    // subtract r limb-by-limb
    for (let i = 0; i < 18; i++) {
      delta[i] = delta[i].sub(R[i]).seal();
    }

    let carry = Field(0);

    for (let i = 0; i < 17; i++) {
      // 17 because we have 18 limbs
      let deltaPlusCarry = delta[i].add(carry).seal();

      carry = Provable.witness(Field, () => deltaPlusCarry.div(1n << 116n));
      rangeCheck128Signed(carry);

      // ensure that after adding the carry, the limb is a multiple of 2^116
      deltaPlusCarry.assertEquals(carry.mul(1n << 116n));
    }

    // the final limb plus carry should be zero to confirm correctness
    delta[17].add(carry).assertEquals(0n);

    return r;
  }

  // (1 / x) % this
  modInv(x: Bigint2048) {
    const inv = Provable.witness(Bigint2048, () => {
      const yBigInt = x.toBigint();
      const pBigInt = this.toBigint();
      const inv = inverse(yBigInt, pBigInt);

      return Bigint2048.from(inv);
    });

    this.modMul(x, inv).assertEquals(Bigint2048.from(1n));

    return inv;
  }

  // (x / y) % this
  modDiv(x: Bigint2048, y: Bigint2048) {
    const inv_y = this.modInv(y);

    let res = this.modMul(inv_y, x);

    return res;
  }

  // sqrt(x) % this
  modSqrt(x: Bigint2048) {
    const sqrt = Provable.witness(Bigint2048, () => {
      const xBigInt = x.toBigint();
      const pBigInt = this.toBigint();
      const sqrt = sqrtMod(xBigInt, pBigInt);

      return Bigint2048.from(sqrt);
    });

    this.modSquare(sqrt).assertEquals(x);

    return sqrt;
  }

  assertEquals(x: Bigint2048) {
    Provable.assertEqual(Bigint2048, this, x);
  }

  toBigint() {
    return this.value.get();
  }

  static from(x: bigint) {
    let fields = [];
    let value = x;
    for (let i = 0; i < 18; i++) {
      fields.push(Field(x & mask));
      x >>= 116n;
    }
    return new Bigint2048({ fields, value: Unconstrained.from(value) });
  }

  static check(x: { fields: Field[] }) {
    for (let i = 0; i < 18; i++) {
      rangeCheck116(x.fields[i]);
    }
  }
}

/**
 * (x + y) mod p
 */
function add(
  x: Bigint2048,
  y: Bigint2048,
  p: Bigint2048,
  { isDouble = false } = {}
) {
  // witness q, r so that x+y = q*p + r
  let { q, r } = Provable.witness(
    Struct({ q: Bigint2048, r: Bigint2048 }),
    () => {
      let xPlusY = x.toBigint() + y.toBigint();
      let p0 = p.toBigint();
      let q = xPlusY / p0;
      let r = xPlusY - q * p0;
      return { q: Bigint2048.from(q), r: Bigint2048.from(r) };
    }
  );

  let delta: Field[] = Array.from({ length: 18 }, () => Field(0));
  let [X, Y, Q, R, P] = [x.fields, y.fields, q.fields, r.fields, p.fields];

  // compute X + Y limb-by-limb
  for (let i = 0; i < 18; i++) {
    if (isDouble) delta[i] = X[i].mul(2);
    else delta[i] = X[i].add(Y[i]);
  }

  // subtract q*p limb-by-limb
  for (let i = 0; i < 18; i++) {
    for (let j = 0; j < 18; j++) {
      if (i + j < 18) {
        delta[i + j] = delta[i + j].sub(Q[i].mul(P[j]));
      }
    }
  }

  // subtract r limb-by-limb
  for (let i = 0; i < 18; i++) {
    delta[i] = delta[i].sub(R[i]).seal();
  }

  let carry = Field(0);

  for (let i = 0; i < 17; i++) {
    // 17 because we have 18 limbs
    let deltaPlusCarry = delta[i].add(carry).seal();

    carry = Provable.witness(Field, () => deltaPlusCarry.div(1n << 116n));
    rangeCheck128Signed(carry);

    // ensure that after adding the carry, the limb is a multiple of 2^116
    deltaPlusCarry.assertEquals(carry.mul(1n << 116n));
  }

  // the final limb plus carry should be zero to assert correctness
  delta[17].add(carry).assertEquals(0n);

  return r;
}

/**
 * x*y mod p
 * assumes x, and y are reduced modulo p
 */
function multiply(
  x: Bigint2048,
  y: Bigint2048,
  p: Bigint2048,
  { isSquare = false } = {}
) {
  if (isSquare) y = x;

  // witness q, r so that x*y = q*p + r
  // this also adds the range checks in `check()`
  let { q, r } = Provable.witness(
    // TODO Struct() should be unnecessary
    Struct({ q: Bigint2048, r: Bigint2048 }),
    () => {
      let xy = x.toBigint() * y.toBigint();
      let p0 = p.toBigint();
      let q = xy / p0;
      let r = xy - q * p0;
      return { q: Bigint2048.from(q), r: Bigint2048.from(r) };
    }
  );

  // compute delta = xy - qp - r
  // we can use a sum of native field products for each limb, because
  // input limbs are range-checked to 116 bits, and 2*116 + log(2*18-1) = 232 + 6 fits the native field.
  let delta: Field[] = Array.from({ length: 2 * 18 - 1 }, () => Field(0));
  let [X, Y, Q, R, P] = [x.fields, y.fields, q.fields, r.fields, p.fields];

  for (let i = 0; i < 18; i++) {
    // when squaring, we can save constraints by not computing xi * xj twice
    if (isSquare) {
      for (let j = 0; j < i; j++) {
        delta[i + j] = delta[i + j].add(X[i].mul(X[j]).mul(2n));
      }
      delta[2 * i] = delta[2 * i].add(X[i].mul(X[i]));
    } else {
      for (let j = 0; j < 18; j++) {
        delta[i + j] = delta[i + j].add(X[i].mul(Y[j]));
      }
    }

    for (let j = 0; j < 18; j++) {
      delta[i + j] = delta[i + j].sub(Q[i].mul(P[j]));
    }

    delta[i] = delta[i].sub(R[i]).seal();
  }

  // perform carrying on the difference to show that it is zero
  let carry = Field(0);

  for (let i = 0; i < 2 * 18 - 2; i++) {
    let deltaPlusCarry = delta[i].add(carry).seal();

    carry = Provable.witness(Field, () => deltaPlusCarry.div(1n << 116n));
    rangeCheck128Signed(carry);

    // (xy - qp - r)_i + c_(i-1) === c_i * 2^116
    // proves that bits i*116 to (i+1)*116 of res are zero
    deltaPlusCarry.assertEquals(carry.mul(1n << 116n));
  }

  // last carry is 0 ==> all of diff is 0 ==> x*y = q*p + r as integers
  delta[2 * 18 - 2].add(carry).assertEquals(0n);

  return r;
}

/**
 * RSA signature verification
 *
 * TODO this is a bit simplistic; according to RSA spec, message must be 256 bits
 * and the remaining bits must follow a specific pattern.
 */
function rsaVerify65537(
  message: Bigint2048,
  signature: Bigint2048,
  modulus: Bigint2048
) {
  // compute signature^(2^16 + 1) mod modulus
  // square 16 times
  let x = signature;
  for (let i = 0; i < 16; i++) {
    x = modulus.modSquare(x);
  }
  // multiply by signature
  x = modulus.modMul(x, signature);

  // check that x == message
  x.assertEquals(message);
}

/**
 * Custom range check for a single limb, x in [0, 2^116)
 */
function rangeCheck116(x: Field) {
  let [x0, x1] = Provable.witnessFields(2, () => [
    x.toBigInt() & ((1n << 64n) - 1n),
    x.toBigInt() >> 64n,
  ]);

  Gadgets.rangeCheck64(x0);
  let [x52] = Gadgets.rangeCheck64(x1);
  x52.assertEquals(0n); // => x1 is 52 bits
  // 64 + 52 = 116
  x0.add(x1.mul(1n << 64n)).assertEquals(x);
}

/**
 * Custom range check for carries, x in [-2^127, 2^127)
 */
function rangeCheck128Signed(xSigned: Field) {
  let x = xSigned.add(1n << 127n);

  let [x0, x1] = Provable.witnessFields(2, () => {
    const x0 = x.toBigInt() & ((1n << 64n) - 1n);
    const x1 = x.toBigInt() >> 64n;
    return [x0, x1];
  });

  Gadgets.rangeCheck64(x0);
  Gadgets.rangeCheck64(x1);

  x0.add(x1.mul(1n << 64n)).assertEquals(x);
}

// copied from https://github.com/zksecurity/mina-credentials/blob/f3c98fed5da3880597e7cbb30dd7bbed91cb5023/src/rsa/rsa.ts#L46
function fromFields(fields: Field[], n: number, k: number) {
  assert(fields.length === k, `expected ${k} limbs`);
  let value = 0n;
  for (let i = k - 1; i >= 0; i--) {
    value <<= BigInt(n);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    value += fields[i]!.toBigInt();
  }
  return value;
}
