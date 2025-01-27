import { Provable } from 'o1js';
import {
  bigAdd,
  bigLessThan,
  bigMod,
  bigModInv,
  bigMult,
  bigMultModP,
  bigSub,
  bigSubModP,
} from './bigint.js';
import { randomBigintRange } from '../utils.js';
import { Bigint2048 } from '../bigint.js';

function bigAdd2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  bigAdd(x.fields, y.fields, 116, 18);
}

const csAdd = await Provable.constraintSystem(() => bigAdd2048());
console.log('\nBigAdd CS Summary:\n', csAdd.summary());

function bigSub2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  bigSub(x.fields, y.fields, 116, 18);
}

const csSub = await Provable.constraintSystem(() => bigSub2048());
console.log('\nBigSub CS Summary:\n', csSub.summary());

function bigMult2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  bigMult(x.fields, y.fields, 116, 18);
}

const csMult = await Provable.constraintSystem(() => bigMult2048());
console.log('\nBigMult CS Summary:\n', csMult.summary());

function bigLessThan2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  bigLessThan(x.fields, y.fields, 116, 18);
}

const csLess = await Provable.constraintSystem(() => bigLessThan2048());
console.log('\nBigLessThan CS Summary:\n', csLess.summary());

function bigMod2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  bigMod(x.fields.concat(x.fields), y.fields, 116, 18);
}

const csMod = await Provable.constraintSystem(() => bigMod2048());
console.log('\nBigMod CS Summary:\n', csMod.summary());

function bigMultMod2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  bigMultModP(x.fields, y.fields, p.fields, 116, 18);
}

const csMultMod = await Provable.constraintSystem(() => bigMultMod2048());
console.log('\nBigMultMod CS Summary:\n', csMultMod.summary());

function bigSubModP2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );
  const y = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  bigSubModP(x.fields, y.fields, p.fields, 116, 18);
}

const csSubModP = await Provable.constraintSystem(() => bigSubModP2048());
console.log('\nBigSubModP CS Summary:\n', csSubModP.summary());

function bigbigModInvP2048() {
  const x = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  const p = Provable.witness(Bigint2048, () =>
    Bigint2048.from(randomBigintRange(2n, 2n ** 256n))
  );

  bigModInv(x.fields, p.fields, 116, 18);
}

const csbigModInvP = await Provable.constraintSystem(() => bigbigModInvP2048());
console.log('\nbigModInvP CS Summary:\n', csbigModInvP.summary());
