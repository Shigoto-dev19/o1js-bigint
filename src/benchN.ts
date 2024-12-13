import { Provable } from 'o1js';
import { randomBigintRange } from './utils.js';
import { BigIntNFactory, createRsaVerify65537 } from './bigintN.js';
const Bigint1024 = BigIntNFactory.create(1024);

function bigModMul1024() {
  const x = Provable.witness(Bigint1024, () =>
    Bigint1024.from(randomBigintRange(2n, 2n ** 256n))
  );

  const y = Provable.witness(Bigint1024, () =>
    Bigint1024.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint1024, () =>
    Bigint1024.from(randomBigintRange(2n, 2n ** 128n))
  );

  p.modMul(x, y);
}

function bigModSquare() {
  const x = Provable.witness(Bigint1024, () =>
    Bigint1024.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint1024, () =>
    Bigint1024.from(randomBigintRange(2n, 2n ** 128n))
  );

  p.modSquare(x);
}

function assertEqualBig1024() {
  const x = Provable.witness(Bigint1024, () =>
    Bigint1024.from(randomBigintRange(2n, 2n ** 256n))
  );

  const y = Provable.witness(Bigint1024, () =>
    Bigint1024.from(randomBigintRange(2n, 2n ** 256n))
  );

  Provable.assertEqual(Bigint1024, x, y);
}

const rsaVerify65537_1024 = createRsaVerify65537(1024);
const BigIntN1024 = BigIntNFactory.create(1024);
function rsa65537_1024() {
  const x = Provable.witness(BigIntN1024, () =>
    BigIntN1024.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(BigIntN1024, () =>
    BigIntN1024.from(randomBigintRange(2n, 2n ** 256n))
  );
  const p = Provable.witness(BigIntN1024, () =>
    BigIntN1024.from(randomBigintRange(2n, 2n ** 256n))
  );

  rsaVerify65537_1024(x, y, p);
}

const rsaVerify65537_2048 = createRsaVerify65537(2048);
const BigIntN2048 = BigIntNFactory.create(2048);
function rsa65537_2048() {
  const x = Provable.witness(BigIntN2048, () =>
    BigIntN2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(BigIntN2048, () =>
    BigIntN2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const p = Provable.witness(BigIntN2048, () =>
    BigIntN2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  rsaVerify65537_2048(x, y, p);
}

const csMul_1024 = await Provable.constraintSystem(() => bigModMul1024());
console.log('ModMul CS Summary:\n', csMul_1024.summary());

const csSq_1024 = await Provable.constraintSystem(() => bigModSquare());
console.log('ModSquare CS Summary:\n', csSq_1024.summary());

const csAEB_1024 = await Provable.constraintSystem(() => assertEqualBig1024());
console.log('AssertEqualBig2048 CS Summary:\n', csAEB_1024.summary());

const csRsa_1024 = await Provable.constraintSystem(() => rsa65537_1024());
console.log('RSA65537 1024 CS Summary:\n', csRsa_1024.summary());

const csRsa_2048 = await Provable.constraintSystem(() => rsa65537_2048());
console.log('RSA65537 2048 CS Summary:\n', csRsa_2048.summary());
