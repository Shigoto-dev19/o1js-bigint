import { Provable } from 'o1js';
import { Bigint2048, rsaVerify65537 } from './bigint.js';
import { randomBigintRange } from './utils.js';

//----------------------------------------------------------------

function bigAdd() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  x.add(y);
}

const csAdd = await Provable.constraintSystem(() => bigAdd());
console.log('\nAdd CS Summary:\n', csAdd.summary());

//----------------------------------------------------------------

function bigModAdd() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  p.modAdd(x, y);
}

const csModAdd = await Provable.constraintSystem(() => bigModAdd());
console.log('\nModAdd CS Summary:\n', csModAdd.summary());

//----------------------------------------------------------------

function bigModDouble() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  p.modDouble(x);
}

const csModDouble = await Provable.constraintSystem(() => bigModDouble());
console.log('\nModDouble CS Summary:\n', csModDouble.summary());

//----------------------------------------------------------------

function bigSub() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 512n))
  );

  x.sub(y);
}

const csSub = await Provable.constraintSystem(() => bigSub());
console.log('\nSub CS Summary:\n', csSub.summary());

//----------------------------------------------------------------

function bigModSub() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  p.modSub(x, y);
}

const csModSub = await Provable.constraintSystem(() => bigModSub());
console.log('\nModSub CS Summary:\n', csModSub.summary());

//----------------------------------------------------------------

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

const csMul = await Provable.constraintSystem(() => bigModMul());
console.log('\nModMul CS Summary:\n', csMul.summary());

//----------------------------------------------------------------

function bigModSquare() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 128n))
  );

  p.modSquare(x);
}

const csSq = await Provable.constraintSystem(() => bigModSquare());
console.log('\nModSquare CS Summary:\n', csSq.summary());

//----------------------------------------------------------------

function bigModPow() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  p.modPow(x, 65537n);
}

const csModPow = await Provable.constraintSystem(() => bigModPow());
console.log('\nModPow CS Summary:\n', csModPow.summary());

//----------------------------------------------------------------

function bigMod() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  p.mod(x);
}

const csMod = await Provable.constraintSystem(() => bigMod());
console.log('\nMod CS Summary:\n', csMod.summary());

//----------------------------------------------------------------

function bigModInv() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  p.modInv(x);
}

const csModInv = await Provable.constraintSystem(() => bigModInv());
console.log('\nModInv CS Summary:\n', csModInv.summary());

//----------------------------------------------------------------

function bigModDiv() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  p.modDiv(x, y);
}

const csModDiv = await Provable.constraintSystem(() => bigModDiv());
console.log('\nModDiv CS Summary:\n', csModDiv.summary());

//----------------------------------------------------------------

function bigModSqrt() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  p.modSqrt(x);
}

const csModSqrt = await Provable.constraintSystem(() => bigModSqrt());
console.log('\nModSqrt CS Summary:\n', csModSqrt.summary());

//----------------------------------------------------------------

function assertEqualBig2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  Provable.assertEqual(Bigint2048, x, y);
}

const csAEB = await Provable.constraintSystem(() => assertEqualBig2048());
console.log('\nAssertEqualBig2048 CS Summary:\n', csAEB.summary());

//----------------------------------------------------------------

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

const csRsa = await Provable.constraintSystem(() => rsa65537());
console.log('\nRSA65537 CS Summary:\n', csRsa.summary());
