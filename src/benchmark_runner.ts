import { Provable } from 'o1js';
import { randomBigintRange } from './utils.js';
import { BigIntNFactory, createRsaVerify65537 } from './bigintN.js';
import { writeFileSync } from 'fs';

async function benchmarkForSize(size: number) {
  const BigIntN = BigIntNFactory.create(size);
  const rsaVerify = createRsaVerify65537(size);

  // Create test functions
  const bigModMul = () => {
    const x = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 256n))
    );

    const y = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 256n))
    );

    const p = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 128n))
    );
    p.modMul(x, y);
  };

  const bigModSquare = () => {
    const x = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 256n))
    );

    const p = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 128n))
    );
    p.modSquare(x);
  };

  const assertEqualBig = () => {
    const x = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 256n))
    );

    const y = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 256n))
    );

    Provable.assertEqual(BigIntN, x, y);
  };

  const rsaTest = () => {
    const x = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 256n))
    );
    const y = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 256n))
    );
    const p = Provable.witness(BigIntN, () =>
      BigIntN.from(randomBigintRange(2n, 2n ** 256n))
    );
    rsaVerify(x, y, p);
  };

  // Generate constraint systems
  const csMul = await Provable.constraintSystem(bigModMul);
  const csSq = await Provable.constraintSystem(bigModSquare);
  const csAEB = await Provable.constraintSystem(assertEqualBig);
  const csRsa = await Provable.constraintSystem(rsaTest);

  return {
    size,
    modMul: csMul.summary(),
    modSquare: csSq.summary(),
    assertEqual: csAEB.summary(),
    rsaVerify: csRsa.summary(),
  };
}

(async function main() {
  const results = [];
  for (let size = 512; size <= 4096; size += 256) {
    console.log(`Benchmarking size: ${size}`);
    const result = await benchmarkForSize(size);
    results.push(result);
  }

  console.log('Writing results to benchmark_results.json');
  writeFileSync('benchmark_results.json', JSON.stringify(results, null, 2));
})();
