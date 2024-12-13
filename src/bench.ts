import { Provable } from 'o1js';
import { Bigint2048, rsaVerify65537 } from './bigint.js';
import { randomBigintRange } from './utils.js';

function bigModMul() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  p.modMul(x, y);
}

function bigModSquare() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 128n))
  );

  p.modSquare(x);
}

function assertEqualBig2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  Provable.assertEqual(Bigint2048, x, y);
}

function rsa65537() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  rsaVerify65537(x, y, p);
}

const csMul = await Provable.constraintSystem(() => bigModMul());
console.log('ModMul CS Summary:\n', csMul.summary());

const csSq = await Provable.constraintSystem(() => bigModSquare());
console.log('ModSquare CS Summary:\n', csSq.summary());

const csAEB = await Provable.constraintSystem(() => assertEqualBig2048());
console.log('AssertEqualBig2048 CS Summary:\n', csAEB.summary());

const csRsa = await Provable.constraintSystem(() => rsa65537());
console.log('RSA65537 CS Summary:\n', csRsa.summary());
