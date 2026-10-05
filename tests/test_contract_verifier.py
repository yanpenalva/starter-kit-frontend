import json
from pathlib import Path
import subprocess
import tempfile
import unittest

from scripts.verify_contract import (
    ARCHIVE_PATH,
    CONTRACT_PATH,
    PIN_PATH,
    RECEIPT_PATH,
    ContractVerificationError,
    strict_json,
    validate_local_refs,
    verify_files,
)


class ContractVerifierTests(unittest.TestCase):
    def test_approved_bundle_verifies_offline(self) -> None:
        verify_files(CONTRACT_PATH, RECEIPT_PATH, ARCHIVE_PATH, PIN_PATH)

    def test_changed_contract_digest_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            changed_contract = root / "openapi.json"
            changed_contract.write_bytes(
                CONTRACT_PATH.read_bytes().replace(b"Starter Kit API", b"Starter Kit APX")
            )
            with self.assertRaises(ContractVerificationError):
                verify_files(changed_contract, RECEIPT_PATH, ARCHIVE_PATH, PIN_PATH)

    def test_changed_archive_digest_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            changed_archive = Path(directory) / "artifact.zip"
            payload = bytearray(ARCHIVE_PATH.read_bytes())
            payload[-1] ^= 1
            changed_archive.write_bytes(payload)
            with self.assertRaises(ContractVerificationError):
                verify_files(CONTRACT_PATH, RECEIPT_PATH, changed_archive, PIN_PATH)

    def test_changed_source_sha_pin_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            changed_pin = Path(directory) / "contract-pin.json"
            pin = json.loads(PIN_PATH.read_text(encoding="utf-8"))
            pin["source"]["commit_sha"] = "0" * 40
            changed_pin.write_text(json.dumps(pin), encoding="utf-8")
            with self.assertRaises(ContractVerificationError):
                verify_files(CONTRACT_PATH, RECEIPT_PATH, ARCHIVE_PATH, changed_pin)

    def test_changed_workflow_identity_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            changed_receipt = Path(directory) / "receipt.json"
            receipt = json.loads(RECEIPT_PATH.read_text(encoding="utf-8"))
            receipt["workflow_id"] = 1
            changed_receipt.write_text(json.dumps(receipt), encoding="utf-8")
            with self.assertRaises(ContractVerificationError):
                verify_files(CONTRACT_PATH, changed_receipt, ARCHIVE_PATH, PIN_PATH)

    def test_duplicate_json_keys_are_rejected(self) -> None:
        with self.assertRaises(ContractVerificationError):
            strict_json(b'{"receipt":1,"receipt":2}', "fixture")

    def test_external_refs_are_rejected(self) -> None:
        with self.assertRaises(ContractVerificationError):
            validate_local_refs({"$ref": "https://outside.invalid/schema.json"})

    def test_generation_wrapper_fails_closed_when_contract_is_missing(self) -> None:
        script = Path(__file__).resolve().parents[1] / "scripts/generate-client.mjs"
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run(
                ["node", str(script)],
                capture_output=True,
                check=False,
                cwd=directory,
                text=True,
            )
        self.assertEqual(result.returncode, 1)
        self.assertIn("Contrato aprovado ausente", result.stderr)


if __name__ == "__main__":
    unittest.main()
