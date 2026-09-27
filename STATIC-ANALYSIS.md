# Static analysis review — 27 September 2026

Internal review, not an independent audit. Slither 0.11.6, crytic-compile 0.4.2, native Solidity 0.8.27 (official binary SHA-256 checked), OpenZeppelin 5.6.1. Four recovered source entry points were scanned with optimizer disabled and Cancun (compiler default). No mainnet transaction was sent and no deployed contract was changed.

## Results and disposition

The unfiltered scan completed successfully and returned 253 records: 3 High, 27 Medium, 1 Low, 222 Informational. Dependencies are analyzed repeatedly across entry points, so record counts are not distinct vulnerabilities. All High/Medium records point to OpenZeppelin Math.sol; none point to project source. No detectors were disabled. The raw scanner still reports these records; this is not a zero-findings claim.

- incorrect-exp: the XOR in the modular inverse seed is intentional. Replacing it with exponentiation would break the algorithm. Classified as a false positive for this use after reading the pinned source.
- divide-before-multiply in mulDiv: factoring powers of two and multiplying by a modular inverse are deliberate steps of exact 512-bit division, not an accidental precision-losing price calculation. Classified as false positives for these operations.
- divide-before-multiply in invMod: quotient and remainder updates are deliberate Euclidean algorithm steps. Classified as a false positive for these operations.
- Low reentrancy-benign in Circuits.fill: state is written after an external parts transfer. fill has nonReentrant; parts is immutable; the batch receiver checks parts, operator and the receiving flag. No unguarded second mint path was identified in this source review. Retain as a reviewed low warning; adversarial callback tests are still desirable. This is not a proof covering every interaction.
- Informational low-level-calls: Desk/Market payment calls check success and their transaction entry points are guarded. Rejecting recipients can cause a purchase to revert; source order and EVM atomicity do not imply a successful partial payment.
- Other informational records concern dependency pragmas, assembly, compiler-version ranges, constants and similar source patterns. A broad pragma is not the compiler actually used; the build is now pinned.

No Solidity or dependency code was changed to hide scanner warnings. These results do not establish that contracts have no vulnerabilities. Metadata provenance, explorer verification, behavior tests and live-site publishing remain separate work.

## Every High/Medium record group

Each item below retains the scanner text and the number of occurrences, accounting for all 30 High/Medium records.

### 1. High: incorrect-exp (3 record(s))

```text
Math.mulDiv(uint256,uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#206-277) has bitwise-xor operator ^ instead of the exponentiation operator **: 
	 - inverse = (3 * denominator) ^ 2 (node_modules/@openzeppelin/contracts/utils/math/Math.sol#259)
```

### 2. Medium: divide-before-multiply (3 record(s))

```text
Math.mulDiv(uint256,uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#206-277) performs a multiplication on the result of a division:
	- low = low / twos (node_modules/@openzeppelin/contracts/utils/math/Math.sol#247)
	- result = low * inverse (node_modules/@openzeppelin/contracts/utils/math/Math.sol#274)
```

### 3. Medium: divide-before-multiply (3 record(s))

```text
Math.invMod(uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#317-363) performs a multiplication on the result of a division:
	- quotient = gcd / remainder (node_modules/@openzeppelin/contracts/utils/math/Math.sol#339)
	- (gcd,remainder) = (remainder,gcd - remainder * quotient) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#341-348)
```

### 4. Medium: divide-before-multiply (3 record(s))

```text
Math.mulDiv(uint256,uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#206-277) performs a multiplication on the result of a division:
	- denominator = denominator / twos (node_modules/@openzeppelin/contracts/utils/math/Math.sol#244)
	- inverse *= 2 - denominator * inverse (node_modules/@openzeppelin/contracts/utils/math/Math.sol#268)
```

### 5. Medium: divide-before-multiply (3 record(s))

```text
Math.mulDiv(uint256,uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#206-277) performs a multiplication on the result of a division:
	- denominator = denominator / twos (node_modules/@openzeppelin/contracts/utils/math/Math.sol#244)
	- inverse = (3 * denominator) ^ 2 (node_modules/@openzeppelin/contracts/utils/math/Math.sol#259)
```

### 6. Medium: divide-before-multiply (3 record(s))

```text
Math.mulDiv(uint256,uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#206-277) performs a multiplication on the result of a division:
	- denominator = denominator / twos (node_modules/@openzeppelin/contracts/utils/math/Math.sol#244)
	- inverse *= 2 - denominator * inverse (node_modules/@openzeppelin/contracts/utils/math/Math.sol#266)
```

### 7. Medium: divide-before-multiply (3 record(s))

```text
Math.mulDiv(uint256,uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#206-277) performs a multiplication on the result of a division:
	- denominator = denominator / twos (node_modules/@openzeppelin/contracts/utils/math/Math.sol#244)
	- inverse *= 2 - denominator * inverse (node_modules/@openzeppelin/contracts/utils/math/Math.sol#267)
```

### 8. Medium: divide-before-multiply (3 record(s))

```text
Math.mulDiv(uint256,uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#206-277) performs a multiplication on the result of a division:
	- denominator = denominator / twos (node_modules/@openzeppelin/contracts/utils/math/Math.sol#244)
	- inverse *= 2 - denominator * inverse (node_modules/@openzeppelin/contracts/utils/math/Math.sol#264)
```

### 9. Medium: divide-before-multiply (3 record(s))

```text
Math.mulDiv(uint256,uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#206-277) performs a multiplication on the result of a division:
	- denominator = denominator / twos (node_modules/@openzeppelin/contracts/utils/math/Math.sol#244)
	- inverse *= 2 - denominator * inverse (node_modules/@openzeppelin/contracts/utils/math/Math.sol#263)
```

### 10. Medium: divide-before-multiply (3 record(s))

```text
Math.mulDiv(uint256,uint256,uint256) (node_modules/@openzeppelin/contracts/utils/math/Math.sol#206-277) performs a multiplication on the result of a division:
	- denominator = denominator / twos (node_modules/@openzeppelin/contracts/utils/math/Math.sol#244)
	- inverse *= 2 - denominator * inverse (node_modules/@openzeppelin/contracts/utils/math/Math.sol#265)
```

## Reproduce

Install contracts dependencies with npm ci. Install slither-analyzer==0.11.6 and crytic-compile==0.4.2 in a Python virtual environment. Supply the official native solc 0.8.27 binary (solc-js is not the command-line compiler used here).

From contracts/:

```sh
slither src/ --solc /path/to/solc-0.8.27 --solc-remaps '@openzeppelin/=node_modules/@openzeppelin/' --json slither-report.json
```

A nonzero process exit code can indicate detector findings; check the JSON success field to distinguish a completed scan from a compilation failure. The initial run had success=true.
