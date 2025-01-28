import {
  fromFields,
  bigAdd,
  bigMult,
  bigSub,
  bigSubModP,
  bigMultModP,
} from './bigint';
import { randomBigintRange } from '../utils';
import { Field, Provable } from 'o1js';
import { Bigint2048 } from '../bigint';

describe('Circom BigAdd tests', () => {
  it('should add two provable bigints', async () => {
    const x = randomBigintRange(2n, 2n ** 256n);
    const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

    const y = randomBigintRange(2n, 2n ** 256n);
    const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

    const resFields = bigAdd(b1.fields, b2.fields, 116, 18);
    const resBig = fromFields(resFields, 116, 19);

    expect(resBig).toEqual(x + y);
  });

  it('should add two max provable bigints', async () => {
    const limbSize = 1n << 116n;
    let x = Array.from({ length: 18 }, () => Field(limbSize));
    const xb = fromFields(x, 116, 18);

    const resFields = bigAdd(x, x, 116, 18);
    const resBig = fromFields(resFields, 116, 19);

    expect(resBig).toEqual(xb * 2n);
  });

  it('should add two provable bigints - 10000 iterations', async () => {
    for (let i = 0; i < 10000; i++) {
      const x = randomBigintRange(2n, 2n ** 256n);
      const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));
      const y = randomBigintRange(2n, 2n ** 256n);
      const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

      const resFields = bigAdd(b1.fields, b2.fields, 116, 18);
      const resBig = fromFields(resFields, 116, 19);

      expect(resBig).toEqual(x + y);
    }
  });
});

describe('Circom BigSub tests', () => {
  it('should sub two provable bigints', async () => {
    const x = randomBigintRange(2n ** 128n, 2n ** 256n);
    const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

    const y = randomBigintRange(2n, 2n ** 128n);
    const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

    const resFields = bigSub(b1.fields, b2.fields, 116, 18);
    const resBig = fromFields(resFields.out, 116, 18);

    expect(resBig).toEqual(x - y);
  });

  it('should reject sub two provable bigints', async () => {
    const x = randomBigintRange(2n ** 128n, 2n ** 256n);
    const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

    const y = randomBigintRange(2n, 2n ** 128n);
    const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

    const resFields = bigSub(b2.fields, b1.fields, 116, 18);
    const resBig = fromFields(resFields.out, 116, 18);

    expect(resBig).not.toEqual(y - x);
  });

  it('should sub two provable bigints - 10000 iterations', async () => {
    for (let i = 0; i < 10000; i++) {
      const x = randomBigintRange(2n ** 128n, 2n ** 256n);
      const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

      const y = randomBigintRange(2n, 2n ** 128n);
      const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

      const resFields = bigSub(b1.fields, b2.fields, 116, 18);
      const resBig = fromFields(resFields.out, 116, 18);

      expect(resBig).toEqual(x - y);
    }
  });
});

describe('Circom BigSubModP tests', () => {
  it('should sub mod two provable bigints', async () => {
    const x = randomBigintRange(2n ** 128n, 2n ** 256n);
    const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

    const y = randomBigintRange(2n, 2n ** 128n);
    const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

    const p = randomBigintRange(2n, 2n ** 512n);
    const bp = Provable.witness(Bigint2048, () => Bigint2048.from(p));

    const resFields = bigSubModP(b1.fields, b2.fields, bp.fields, 116, 18);

    const resBig = fromFields(resFields, 116, 18);

    expect(resBig).toEqual((x - y) % p);
  });

  it('should reject sub mod two provable bigints', async () => {
    const x = randomBigintRange(2n ** 128n, 2n ** 256n);
    const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

    const y = randomBigintRange(2n, 2n ** 128n);
    const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

    const p = randomBigintRange(2n, 2n ** 512n);
    const bp = Provable.witness(Bigint2048, () => Bigint2048.from(p));

    const resFields = bigSubModP(b2.fields, b1.fields, bp.fields, 116, 18);

    const resBig = fromFields(resFields, 116, 18);

    expect(resBig).not.toEqual((x - y) % p);
  });

  it('should sub mod two provable bigints - 1000 iterations', async () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomBigintRange(2n ** 128n, 2n ** 256n);
      const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

      const y = randomBigintRange(2n, 2n ** 128n);
      const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

      const resFields = bigSub(b1.fields, b2.fields, 116, 18);
      const resBig = fromFields(resFields.out, 116, 18);

      expect(resBig).toEqual(x - y);
    }
  });
});

describe('Circom BigMult tests', () => {
  it('should multiply two provable bigints', async () => {
    const x = randomBigintRange(2n ** 128n, 2n ** 256n);
    const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

    const y = randomBigintRange(2n, 2n ** 128n);
    const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

    const resFields = bigMult(b1.fields, b2.fields, 116, 18);
    const resBig = fromFields(resFields, 116, 36);

    expect(resBig).toEqual(x * y);
  });

  it('should multiply two provable bigints - 10000 iterations', async () => {
    for (let i = 0; i < 10000; i++) {
      const x = randomBigintRange(2n ** 128n, 2n ** 256n);
      const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

      const y = randomBigintRange(2n, 2n ** 128n);
      const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

      const resFields = bigMult(b1.fields, b2.fields, 116, 18);
      const resBig = fromFields(resFields, 116, 36);

      expect(resBig).toEqual(x * y);
    }
  });
});

describe('Circom BigMultModP tests', () => {
  it('should multiply mod two provable bigints', async () => {
    const x = randomBigintRange(2n ** 128n, 2n ** 256n);
    const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

    const y = randomBigintRange(2n, 2n ** 128n);
    const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

    const p = randomBigintRange(2n, 2n ** 512n);
    const bp = Provable.witness(Bigint2048, () => Bigint2048.from(p));

    const resFields = bigMultModP(b1.fields, b2.fields, bp.fields, 116, 18);
    const resBig = fromFields(resFields.mod, 116, 18);

    expect(resBig).toEqual((x * y) % p);
  });

  it('should multiply mod two provable bigints - 1000 iterations', async () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomBigintRange(2n ** 128n, 2n ** 256n);
      const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

      const y = randomBigintRange(2n, 2n ** 128n);
      const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

      const p = randomBigintRange(2n, 2n ** 512n);
      const bp = Provable.witness(Bigint2048, () => Bigint2048.from(p));

      const resFields = bigMultModP(b1.fields, b2.fields, bp.fields, 116, 18);
      const resBig = fromFields(resFields.mod, 116, 18);

      expect(resBig).toEqual((x * y) % p);
    }
  });
});
