/**
 * RSA signature verification with o1js
 */
import { Field, Gadgets, Provable, Struct, Unconstrained } from 'o1js';

export { BigIntNFactory, createRsaVerify65537 };

const mask = (1n << 116n) - 1n;

class BigIntNFactory {
  static create(size: number) {
    const N = Math.ceil(size / 116);
    const FieldN = Provable.Array(Field, N);

    // Multiplication logic stays as is, but is now a closure capturing N, mask, etc.
    function multiply(
      x: BigintN,
      y: BigintN,
      p: BigintN,
      { isSquare = false } = {}
    ) {
      if (isSquare) y = x;

      let { q, r } = Provable.witness(
        Struct({ q: BigintN, r: BigintN }),
        () => {
          let xy = x.toBigint() * y.toBigint();
          let p0 = p.toBigint();
          let q = xy / p0;
          let r = xy - q * p0;
          return { q: BigintN.from(q), r: BigintN.from(r) };
        }
      );

      let delta: Field[] = Array.from({ length: 2 * N - 1 }, () => Field(0));
      let [X, Y, Q, R, P] = [x.fields, y.fields, q.fields, r.fields, p.fields];

      for (let i = 0; i < N; i++) {
        // when squaring, we can save constraints by not computing xi * xj twice
        if (isSquare) {
          for (let j = 0; j < i; j++) {
            delta[i + j] = delta[i + j].add(X[i].mul(X[j]).mul(2n));
          }
          delta[2 * i] = delta[2 * i].add(X[i].mul(X[i]));
        } else {
          for (let j = 0; j < N; j++) {
            delta[i + j] = delta[i + j].add(X[i].mul(Y[j]));
          }
        }

        for (let j = 0; j < N; j++) {
          delta[i + j] = delta[i + j].sub(Q[i].mul(P[j]));
        }

        delta[i] = delta[i].sub(R[i]).seal();
      }

      // perform carrying on the difference to show that it is zero
      let carry = Field(0);

      for (let i = 0; i < 2 * N - 2; i++) {
        let deltaPlusCarry = delta[i].add(carry).seal();

        carry = Provable.witness(Field, () => deltaPlusCarry.div(1n << 116n));
        rangeCheck128Signed(carry);

        // (xy - qp - r)_i + c_(i-1) === c_i * 2^116
        deltaPlusCarry.assertEquals(carry.mul(1n << 116n));
      }

      // last carry is 0 ==> all of diff is 0 ==> x*y = q*p + r as integers
      delta[2 * N - 2].add(carry).assertEquals(0n);

      return r;
    }

    // Define the BigintN class inside the factory method so it can access N, multiply, etc.
    class BigintN extends Struct({
      fields: FieldN,
      value: Unconstrained.withEmpty(0n),
    }) {
      modMul(x: BigintN, y: BigintN) {
        return multiply(x, y, this);
      }

      modSquare(x: BigintN) {
        return multiply(x, x, this, { isSquare: true });
      }

      toBigint() {
        return this.value.get();
      }

      static from(x: bigint) {
        let fields = [];
        let value = x;
        let temp = x;

        for (let i = 0; i < N; i++) {
          fields.push(Field(temp & mask));
          temp >>= 116n;
        }

        return new BigintN({ fields, value: Unconstrained.from(value) });
      }

      static check(x: { fields: Field[] }) {
        for (let i = 0; i < N; i++) {
          rangeCheck116(x.fields[i]);
        }
      }
    }

    return BigintN;
  }
}

/**
 * RSA signature verification
 *
 * TODO this is a bit simplistic; according to RSA spec, message must be 256 bits
 * and the remaining bits must follow a specific pattern.
 */
function createRsaVerify65537(size: number) {
  const BigIntN = BigIntNFactory.create(size);

  // Now BigIntN is a known class type in this scope, so we can use it in the signature
  return function rsaVerify65537(
    message: InstanceType<typeof BigIntN>,
    signature: InstanceType<typeof BigIntN>,
    modulus: InstanceType<typeof BigIntN>
  ) {
    // compute signature^(2^16 + 1) mod modulus
    let x = signature;
    for (let i = 0; i < 16; i++) {
      x = modulus.modSquare(x);
    }
    x = modulus.modMul(x, signature);

    // check that x == message
    Provable.assertEqual(BigIntN, message, x);
  };
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
