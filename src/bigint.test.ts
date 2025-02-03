import { randomBigintRange, randomPrime } from './utils';
import { Field } from 'o1js';
import { Bigint2048, fromFields } from './bigint';
import bigInt from 'big-integer';

const MAX_2048 = fromFields(
  Array.from({ length: 18 }, () => Field((1n << 116n) - 1n)),
  116,
  18
);
const MAX_BIG_2048 = Bigint2048.from(MAX_2048);

const ITERATIONS = 100;

describe('BigInt AddMod tests', () => {
  it('should add mod two random bigints', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n, 2n ** 2048n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.modAdd(b1, b2).remainder.value.get()).toEqual((x + y) % p);
  });

  it(`should add mod two random bigints - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const y = randomBigintRange(2n, 2n ** 2048n);
      const b2 = Bigint2048.from(y);

      const p = randomBigintRange(2n, 2n ** 2048n);
      const bp = Bigint2048.from(p);

      expect(bp.modAdd(b1, b2).remainder.value.get()).toEqual((x + y) % p);
    }
  });

  it('should add mod two random bigints - associative', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);
    const y = randomBigintRange(2n, 2n ** 2048n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.modAdd(b1, b2).remainder.value.get()).toEqual((x + y) % p);
    expect(bp.modAdd(b1, b2).remainder.value.get()).toEqual(
      bp.modAdd(b2, b1).remainder.value.get()
    );
  });

  it('should add mod one random bigint with 0', async () => {
    const b1 = Bigint2048.from(0n);

    const y = randomBigintRange(2n, 2n ** 2048n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.modAdd(b1, b2).remainder.value.get()).toEqual(y % p);
  });

  it('should add mod one random bigint to itself', async () => {
    const x = randomBigintRange(2n, 2n ** 256n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 256n);
    const bp = Bigint2048.from(p);

    expect(bp.modAdd(b1, b1).remainder.value.get()).toEqual((2n * x) % p);
  });

  it('should add mod two max bigints', async () => {
    const p = randomBigintRange(2n, 2n ** 256n);
    const bp = Bigint2048.from(p);

    const res = bp.modAdd(MAX_BIG_2048, MAX_BIG_2048).remainder;

    expect(res.value.get()).toEqual((2n * MAX_2048) % p);
  });

  it('should add mod two random bigints returning 0 mod p', async () => {
    const b1 = Bigint2048.from(0n);

    const p = randomBigintRange(2n, 2n ** 256n);
    const bp = Bigint2048.from(p);

    expect(bp.modAdd(b1, bp).remainder.value.get()).toEqual(0n);
  });

  it('should add mod two random bigints for a, b > p', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);
    const y = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n, 2n ** 256n);
    const bp = Bigint2048.from(p);

    expect(bp.modAdd(b1, b2).remainder.value.get()).toEqual((x + y) % p);
  });

  it('should add mod two random bigints for a, b > p - 100 iterations', async () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);
      const y = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b2 = Bigint2048.from(y);

      const p = randomBigintRange(2n, 2n ** 256n);
      const bp = Bigint2048.from(p);

      expect(bp.modAdd(b1, b2).remainder.value.get()).toEqual((x + y) % p);
    }
  });
});

describe('BigInt DoubleMod tests', () => {
  it('should double mod a random bigint', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.modDouble(b1).remainder.value.get()).toEqual((x * 2n) % p);
  });

  it(`should double mod a random bigint - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const p = randomBigintRange(2n, 2n ** 2048n);
      const bp = Bigint2048.from(p);

      expect(bp.modDouble(b1).remainder.value.get()).toEqual((x * 2n) % p);
    }
  });

  it('should double mod 0', async () => {
    const b1 = Bigint2048.from(0n);

    const p = randomBigintRange(2n, 2n ** 256n);
    const bp = Bigint2048.from(p);

    expect(bp.modDouble(b1).remainder.value.get()).toEqual(0n);
  });

  it('should double mod a max bigint', async () => {
    const b1 = MAX_BIG_2048;

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.modDouble(b1).remainder.value.get()).toEqual((MAX_2048 * 2n) % p);
  });

  it('should double mod a random bigint bigger than the modulus', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 512n);
    const bp = Bigint2048.from(p);

    expect(bp.modDouble(b1).remainder.value.get()).toEqual((x * 2n) % p);
  });
});

describe('BigInt Add tests', () => {
  it('should add two random bigints', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n, 2n ** 2048n);
    const b2 = Bigint2048.from(y);

    expect(b1.add(b2).value.get()).toEqual(x + y);
  });

  it('should add a random bigint to itself', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    expect(b1.add(b1).value.get()).toEqual(x * 2n);
  });

  it(`should add two random bigints - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const y = randomBigintRange(2n, 2n ** 2048n);
      const b2 = Bigint2048.from(y);

      expect(b1.add(b2).value.get()).toEqual(x + y);
    }
  });

  it('should add two max random bigints', async () => {
    const max = 2n ** 2048n;
    const b = Bigint2048.from(max);

    expect(b.add(b).value.get()).toEqual(max * 2n);
  });
});

describe('BigInt SubMod tests', () => {
  it('should sub mod two random bigints', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n, 2n ** 1024n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.modSub(b1, b2).remainder.value.get()).toEqual((x - y) % p);
  });

  it('should sub mod two random bigints - 1000', async () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const y = randomBigintRange(2n, 2n ** 1024n);
      const b2 = Bigint2048.from(y);

      const p = randomBigintRange(2n, 2n ** 2048n);
      const bp = Bigint2048.from(p);

      expect(bp.modSub(b1, b2).remainder.value.get()).toEqual((x - y) % p);
    }
  });

  it('should return 0 subtracting a random bigint from itself', async () => {
    const x = randomBigintRange(2n, 2n ** 1024n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.modSub(b1, b1).remainder.value.get()).toEqual(0n);
  });

  it('should throw when sub mod two random bigints where x < y', async () => {
    const x = randomBigintRange(2n, 2n ** 128n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n ** 129n, 2n ** 1024n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(() => bp.modSub(b1, b2).remainder).toThrow();
  });

  it(`should throw when sub mod two random bigints where x < y - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n, 2n ** 128n);
      const b1 = Bigint2048.from(x);
      const y = randomBigintRange(2n ** 129n, 2n ** 1024n);
      const b2 = Bigint2048.from(y);

      const p = randomBigintRange(2n, 2n ** 512n);
      const bp = Bigint2048.from(p);

      expect(() => bp.modSub(b1, b2).remainder).toThrow();
    }
  });

  it('should sub mod two random bigints for x, y > p', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n ** 512n, 2n ** 1024n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n, 2n ** 512n);
    const bp = Bigint2048.from(p);

    expect(bp.modSub(b1, b2).remainder.value.get()).toEqual((x - y) % p);
  });

  it('should sub mod two random bigints for x, y > p - 1000 iterations', async () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const y = randomBigintRange(2n ** 512n, 2n ** 1024n);
      const b2 = Bigint2048.from(y);

      const p = randomBigintRange(2n, 2n ** 512n);
      const bp = Bigint2048.from(p);

      expect(bp.modSub(b1, b2).remainder.value.get()).toEqual((x - y) % p);
    }
  });
});

describe('BigInt Sub tests', () => {
  it('should sub two random bigints', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n ** 128n, 2n ** 1024n);
    const b2 = Bigint2048.from(y);

    expect(b1.sub(b2).value.get()).toEqual(x - y);
  });

  it(`should sub two random bigints - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const y = randomBigintRange(2n ** 128n, 2n ** 1024n);
      const b2 = Bigint2048.from(y);

      expect(b1.sub(b2).value.get()).toEqual(x - y);
    }
  });

  it('should sub 0 from a random bigint to return itself', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const b2 = Bigint2048.from(0n);

    expect(b1.sub(b2).value.get()).toEqual(x);
  });

  it('should return 0 when subtracting a random bigint from itself', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    expect(b1.sub(b1).value.get()).toEqual(0n);
  });

  it('should subtract a random bigint from max', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    expect(MAX_BIG_2048.sub(b1).value.get()).toEqual(MAX_2048 - x);
  });

  it('should throw when sub two random bigints where x < y ', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n ** 128n, 2n ** 1024n);
    const b2 = Bigint2048.from(y);

    expect(() => b2.sub(b1)).toThrow();
  });

  it('should throw when sub two random bigints where x < y - 1000 iterations', async () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const y = randomBigintRange(2n ** 128n, 2n ** 1024n);
      const b2 = Bigint2048.from(y);

      expect(() => b2.sub(b1)).toThrow();
    }
  });
});

describe('BigInt Mod tests', () => {
  it('should mod one random bigint', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.mod(b1).remainder.value.get()).toEqual(x % p);
  });

  it(`should mod one random bigint - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const p = randomBigintRange(2n, 2n ** 2048n);
      const bp = Bigint2048.from(p);

      expect(bp.mod(b1).remainder.value.get()).toEqual(x % p);
    }
  });

  it('should return 0 for p mod p', async () => {
    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.mod(bp).remainder.value.get()).toEqual(0n);
  });

  it('should mod the max bigint', async () => {
    const x = MAX_2048;
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(bp.mod(b1).remainder.value.get()).toEqual(x % p);
  });

  it('should mod one random bigint where x > p', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 1024n);
    const bp = Bigint2048.from(p);

    expect(bp.mod(b1).remainder.value.get()).toEqual(x % p);
  });

  it('should mod one random bigint where x > p - 1000 iterations', async () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const p = randomBigintRange(2n, 2n ** 1024n);
      const bp = Bigint2048.from(p);

      expect(bp.mod(b1).remainder.value.get()).toEqual(x % p);
    }
  });
});

// assumes a,b < p
describe('BigInt MulMod tests', () => {
  it('should mul mod two random bigints', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n, 2n ** 2048n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const res = bp.modMul(b1, b2).remainder.value.get();
    expect(res).toEqual((x * y) % p);
  });

  it(`should mul mod two random bigints - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const y = randomBigintRange(2n, 2n ** 2048n);
      const b2 = Bigint2048.from(y);

      const p = randomBigintRange(2n, 2n ** 2048n);
      const bp = Bigint2048.from(p);

      const res = bp.modMul(b1, b2).remainder.value.get();
      expect(res).toEqual((x * y) % p);
    }
  });

  it('should return 0 for mul mod a random bigint with 0', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const b2 = Bigint2048.from(0n);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const res = bp.modMul(b1, b2).remainder.value.get();
    expect(res).toEqual(0n);
  });

  it('should return self for mul mod a random bigint with 1', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const b2 = Bigint2048.from(1n);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const res = bp.modMul(b1, b2).remainder.value.get();
    expect(res).toEqual(x % p);
  });

  it('should verify that mul mod is commutative for two random bigints', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n, 2n ** 2048n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const res1 = bp.modMul(b1, b2).remainder.value.get();
    const res2 = bp.modMul(b2, b1).remainder.value.get();

    expect(res1).toEqual(res2);
    expect(res1).toEqual((x * y) % p);
  });

  it('should throw when mul mod two max random bigints - x , y > p', async () => {
    const p = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    expect(() => bp.modMul(MAX_BIG_2048, MAX_BIG_2048)).toThrow();
  });

  it('should throw when mul mod two random bigints for a, b > p', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b2 = Bigint2048.from(y);

    const p = randomBigintRange(2n ** 512n, 2n ** 1024n);
    const bp = Bigint2048.from(p);

    expect(() => bp.modMul(b1, b2).remainder).toThrow();
  });

  it(`should throw when mul mod two random bigints for a, b > p - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const y = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b2 = Bigint2048.from(y);

      const p = randomBigintRange(2n ** 512n, 2n ** 1024n);
      const bp = Bigint2048.from(p);

      expect(() => bp.modMul(b1, b2).remainder).toThrow();
    }
  });
});

// assumes a,b < p
describe('BigInt SquareMod tests', () => {
  it('should mul square a random bigint', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const res = bp.modSquare(b1).remainder.value.get();
    expect(res).toEqual(x ** 2n % p);
  });

  it(`should mul square a random bigint - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const p = randomBigintRange(2n, 2n ** 2048n);
      const bp = Bigint2048.from(p);

      const res = bp.modSquare(b1).remainder.value.get();
      expect(res).toEqual(x ** 2n % p);
    }
  });

  it('should return 0 for square mod a bigint 0', async () => {
    const b1 = Bigint2048.from(0n);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const res = bp.modSquare(b1).remainder.value.get();
    expect(res).toEqual(0n);
  });

  it('should return self for square mod a bigint 1', async () => {
    const b1 = Bigint2048.from(1n);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const res = bp.modSquare(b1).remainder.value.get();
    expect(res).toEqual(1n);
  });

  it('should throw when square mod a max random bigint - a > p', async () => {
    const p = randomBigintRange(2n ** 2048n, 2n ** 2088n);
    const bp = Bigint2048.from(p);

    expect(() => bp.modSquare(MAX_BIG_2048)).toThrow();
  });

  it('should throw when square mod a random bigint for a > p', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n ** 256n, 2n ** 512n);
    const bp = Bigint2048.from(p);

    expect(() => bp.modSquare(b1).remainder).toThrow();
  });

  it(`should throw when square mod a random bigint for a > p - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const p = randomBigintRange(2n ** 256n, 2n ** 512n);
      const bp = Bigint2048.from(p);

      expect(() => bp.modSquare(b1).remainder).toThrow();
    }
  });
});

describe('BigInt InvMod tests', () => {
  it('should inv mod a random bigint', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomPrime(128);
    const bp = Bigint2048.from(p);

    const res = bp.modInv(b1).value.get().toString();
    expect(res).toEqual(bigInt(x).modInv(p).toString());
  });

  it(`should inv mod a random bigint - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const p = randomPrime(256);
      const bp = Bigint2048.from(p);

      const res = bp.modInv(b1).value.get().toString();
      expect(res).toEqual(bigInt(x).modInv(p).toString());
    }
  });

  it('should throw an error for inv mod if the modulus is not prime', async () => {
    const x = randomBigintRange(2n, 2n ** 1024n) * 2n;
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 1024n) * 2n;
    const bp = Bigint2048.from(p);

    expect(() => bp.modInv(b1)).toThrow();
  });

  it('should not throw an error for inv mod if the modulus is not prime and the input is prime', async () => {
    const x = randomPrime(512);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const res = bp.modInv(b1).value.get().toString();
    expect(res).toEqual(bigInt(x).modInv(p).toString());
  });

  it('should return 1 for mod inv a bigint 1', async () => {
    const b1 = Bigint2048.from(1n);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const res = bp.modInv(b1).value.get();
    expect(res).toEqual(1n);
  });

  it('should mod inv a MAX random bigint for x > p ', async () => {
    const x = MAX_2048;
    const b1 = Bigint2048.from(x);

    const p = randomPrime(128);
    const bp = Bigint2048.from(p);

    const res = bp.modInv(b1).value.get().toString();
    expect(res).toEqual(bigInt(x).modInv(p).toString());
  });

  it.skip(`should mod inv a MAX random bigint for x > p - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = MAX_2048;
      const b1 = Bigint2048.from(x);

      const p = randomPrime(128);
      const bp = Bigint2048.from(p);

      const res = bp.modInv(b1).value.get().toString();
      expect(res).toEqual(bigInt(x).modInv(p).toString());
    }
  });
});

describe('BigInt DivMod tests', () => {
  it('should div mod two random bigints', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const y = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b2 = Bigint2048.from(y);

    const p = randomPrime(256);
    const bp = Bigint2048.from(p);

    const res = bp.modDiv(b1, b2).remainder.value.get();
    const expectedRes = (BigInt(bigInt(y).modInv(p).toString()) * x) % p;

    expect(res).toEqual(expectedRes);
  });

  it(`should div mod two random bigints - ${ITERATIONS} iterations`, async () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const x = randomBigintRange(2n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const y = randomBigintRange(2n, 2n ** 2048n);
      const b2 = Bigint2048.from(y);

      const p = randomPrime(256);
      const bp = Bigint2048.from(p);

      const res = bp.modDiv(b1, b2).remainder.value.get();
      const expectedRes = (BigInt(bigInt(y).modInv(p).toString()) * x) % p;

      expect(res).toEqual(expectedRes);
    }
  });

  it('should return 1 when div mod a random bigint by itself', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomPrime(256);
    const bp = Bigint2048.from(p);

    const res = bp.modDiv(b1, b1).remainder.value.get();

    expect(res).toEqual(1n);
  });
});

// assumes a < p
describe('BigInt PowMod tests', () => {
  it('should pow mod two random bigints', async () => {
    const x = randomBigintRange(2n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 2048n);
    const bp = Bigint2048.from(p);

    const e = randomBigintRange(2n, 2n ** 21n);

    const res = bp.modPow(b1, e).value.get().toString();
    const expectedRes = bigInt(x).modPow(e, p).toString();
    expect(res).toEqual(expectedRes);
  });

  it('should pow mod two random bigints - 250 iteration', async () => {
    for (let i = 0; i < 250; i++) {
      const x = randomBigintRange(2n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const p = randomBigintRange(2n, 2n ** 2048n);
      const bp = Bigint2048.from(p);

      const e = randomBigintRange(2n, 2n ** 21n);
      expect(bp.modPow(b1, e).value.get().toString()).toEqual(
        bigInt(x).modPow(e, p).toString()
      );
    }
  });

  it('should pow mod 0 return 1', async () => {
    const x = randomBigintRange(2n, 2n ** 256n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 256n);
    const bp = Bigint2048.from(p);

    expect(bp.modPow(b1, 0n).value.get()).toEqual(1n);
  });

  it('should throw when pow mod two random bigints for a > p', async () => {
    const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
    const b1 = Bigint2048.from(x);

    const p = randomBigintRange(2n, 2n ** 1024n);
    const bp = Bigint2048.from(p);

    const e = randomBigintRange(2n, 2n ** 21n);

    expect(() => bp.modPow(b1, e)).toThrow();
  });

  it('should throw when pow mod two random bigints for a > p - 1000 iterations', async () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomBigintRange(2n ** 1024n, 2n ** 2048n);
      const b1 = Bigint2048.from(x);

      const p = randomBigintRange(2n, 2n ** 1024n);
      const bp = Bigint2048.from(p);

      const e = randomBigintRange(2n, 2n ** 21n);

      expect(() => bp.modPow(b1, e)).toThrow();
    }
  });
});

// Witnessing the modular square root for bigints using the Tonelli-Shanks algorithm can be quite slow.
describe.skip('BigInt SqrtMod tests', () => {
  it('should sqrt mod a random random bigint', async () => {
    const p = randomPrime(256);
    const bp = Bigint2048.from(p);

    const x = randomBigintRange(2n, 2n ** 512n);
    const xSquare = x ** 2n % p;
    const b1 = Bigint2048.from(xSquare);

    const expected1 = x % p;
    const expected2 = (p - expected1) % p;

    const res = bp.modSqrt(b1).value.get();
    expect([expected1, expected2]).toContain(res);
  });

  it(`should sqrt mod a random random bigint - 100 iterations`, async () => {
    for (let i = 0; i < 100; i++) {
      const p = randomPrime(256);
      const bp = Bigint2048.from(p);

      const x = randomBigintRange(2n, 2n ** 512n) % p;
      const xSquare = x ** 2n % p;
      const b1 = Bigint2048.from(xSquare);

      const expected1 = x % p;
      const expected2 = (p - expected1) % p;

      const res = bp.modSqrt(b1).value.get();
      expect([expected1, expected2]).toContain(res);
    }
  });

  it('should throw if the random bigint modulus is not prime', async () => {
    const p = randomPrime(256) * 2n;
    const bp = Bigint2048.from(p);

    const x = randomBigintRange(2n, 2n ** 512n);
    const xSquare = x ** 2n % p;
    const b1 = Bigint2048.from(xSquare);

    expect(() => bp.modSqrt(b1)).toThrow();
  });

  it('should sqrt mod a random random bigint for a > p', async () => {
    const p = randomPrime(256);
    const bp = Bigint2048.from(p);

    const x = randomBigintRange(2n ** 256n, 2n ** 512n);
    const xSquare = x ** 2n % p;
    const b1 = Bigint2048.from(xSquare);

    const expected1 = x % p;
    const expected2 = (p - expected1) % p;

    const res = bp.modSqrt(b1).value.get();
    expect([expected1, expected2]).toContain(res);
  });
});
