import { bigAdd, unsafeFromLimbs } from './bigint';
import { randomBigintRange } from '../utils';
import { Provable } from 'o1js';
import { Bigint2048 } from '../bigint';

describe('Circom BigAdd tests', () => {
  it('should add two provable bigints', async () => {
    const x = randomBigintRange(2n, 2n ** 256n);
    const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

    const y = randomBigintRange(2n, 2n ** 256n);
    const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

    const resFields = bigAdd(b1.fields, b2.fields, 116, 18);
    const resBig = unsafeFromLimbs(resFields, 116, 19);

    expect(resBig).toEqual(x + y);
  });

  it('should add two provable bigints - 1000 iterations', async () => {
    for (let i = 0; i < 1000; i++) {
      const x = randomBigintRange(2n, 2n ** 256n);
      const b1 = Provable.witness(Bigint2048, () => Bigint2048.from(x));

      const y = randomBigintRange(2n, 2n ** 256n);
      const b2 = Provable.witness(Bigint2048, () => Bigint2048.from(y));

      const resFields = bigAdd(b1.fields, b2.fields, 116, 18);
      const resBig = unsafeFromLimbs(resFields, 116, 19);

      expect(resBig).toEqual(x + y);
    }
  });
});
