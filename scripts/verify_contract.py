from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
import hashlib
import importlib
from io import StringIO
import json
from pathlib import Path
import sys
from types import ModuleType
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OPENAPI = ROOT / "openapi"
PIN_PATH = OPENAPI / "contract-pin.json"
CONTRACT_PATH = OPENAPI / "openapi.json"
RECEIPT_PATH = OPENAPI / "receipt.json"
ARCHIVE_PATH = OPENAPI / "artifact.zip"
VERIFIER_PATH = ROOT / "scripts/vendor/openapi-contract"

EXPECTED_PIN: dict[str, Any] = {
    "schema_version": 1,
    "policy_source": "Parent authorization in FEAT-7 retake prompt, 2026-10-05",
    "source": {
        "repository": "yanpenalva/starter-kit-api",
        "commit_sha": "e646c34a280b851847676af290494e872edcaa9b",
        "branch": "main",
    },
    "workflow": {
        "name": "OpenAPI Contract",
        "path": ".github/workflows/openapi.yml",
        "id": 374937885,
        "event": "workflow_dispatch",
    },
    "run": {
        "id": 37255680565,
        "attempt": 1,
        "status": "completed",
        "conclusion": "success",
    },
    "artifact": {
        "id": 11321734331,
        "name": "openapi-e646c34a280b851847676af290494e872edcaa9b",
        "archive_file": "artifact.zip",
        "archive_bytes": 2044,
        "archive_sha256": "0d019b1adfc1d9d3f3fb65f0544d15fcc0d51a7361e23508204c8e2a5646a6fe",
        "contract_file": "openapi.json",
        "contract_bytes": 21323,
        "contract_sha256": "ed772d267e56784b9a847743575a242b049697ffe35369c541913903c0b24914",
    },
    "verification": {
        "mode": "verify-committed",
        "max_age_days_for_download": 90,
        "clock_skew_seconds_for_download": 300,
        "max_archive_bytes": 10485760,
        "max_contract_bytes": 65536,
        "duplicate_json_keys": "reject",
        "external_refs": "reject",
        "committed_snapshot_expiration": "not-applied",
    },
}


class ContractVerificationError(ValueError):
    pass


def verifier_module(name: str) -> ModuleType:
    verifier_root = str(VERIFIER_PATH)
    if verifier_root not in sys.path:
        sys.path.insert(0, verifier_root)
    return importlib.import_module(name)


def strict_json(payload: bytes, description: str) -> Any:
    try:
        duplicate_hook = verifier_module("contract_core").check_duplicate_keys
        return json.loads(payload.decode("utf-8"), object_pairs_hook=duplicate_hook)
    except Exception as error:
        raise ContractVerificationError(
            f"JSON inválido ou com chaves duplicadas em {description}"
        ) from error


def validate_local_refs(document: Any) -> None:
    pending = [document]
    while pending:
        current = pending.pop()
        if isinstance(current, dict):
            for key, value in current.items():
                if key == "$ref":
                    if not isinstance(value, str) or not value.startswith("#/"):
                        raise ContractVerificationError("Contrato contém $ref externo ou inválido")
                pending.append(value)
        if isinstance(current, list):
            pending.extend(current)


def verify_files(
    contract_path: Path,
    receipt_path: Path,
    archive_path: Path,
    pin_path: Path,
) -> None:
    run_cli = verifier_module("contract_cli").run_cli
    core = verifier_module("contract_core")
    extractor = verifier_module("contract_extract")
    max_artifact_bytes = core.MAX_ARTIFACT_BYTES

    pin_bytes = core.read_bounded_bytes(pin_path, 65536, "Pin manifest")
    pin = strict_json(pin_bytes, "manifesto de pin")
    if pin != EXPECTED_PIN:
        raise ContractVerificationError("Manifesto de pin diverge da política aprovada")

    contract_bytes = core.read_bounded_bytes(contract_path, 65536, "Contract")
    document = strict_json(contract_bytes, "OpenAPI")
    validate_local_refs(document)
    extractor.reject_remote_refs(contract_bytes, "openapi.json")
    if not isinstance(document, dict):
        raise ContractVerificationError("Documento OpenAPI precisa ser objeto JSON")
    if document.get("servers") != [{"url": "/"}]:
        raise ContractVerificationError("Contrato aprovado deve usar servidor root-relative '/'")

    if archive_path.stat().st_size > max_artifact_bytes:
        raise ContractVerificationError("ZIP de origem excede o limite de 10 MiB")
    try:
        archive_bytes = extractor.read_bounded_archive(
            str(archive_path), max_artifact_bytes
        )
    except extractor.ArchiveSafetyError as error:
        raise ContractVerificationError("ZIP de origem ausente ou inválido") from error
    archive_digest = hashlib.sha256(archive_bytes).hexdigest()
    if archive_digest != EXPECTED_PIN["artifact"]["archive_sha256"]:
        raise ContractVerificationError("Hash do ZIP diverge do pin aprovado")
    try:
        extracted = extractor.safe_extract_archive(
            archive_bytes,
            extractor.ExtractionPolicy(
                max_file_bytes=65536,
                max_total_bytes=max_artifact_bytes,
            ),
        )
    except extractor.ArchiveSafetyError as error:
        raise ContractVerificationError("ZIP de origem inválido ou inseguro") from error
    if extracted.files != ("openapi.json",) or extracted.file_sha256 != EXPECTED_PIN["artifact"]["contract_sha256"]:
        raise ContractVerificationError("Conteúdo extraído do ZIP diverge do contrato pinado")
    if len(contract_bytes) != EXPECTED_PIN["artifact"]["contract_bytes"]:
        raise ContractVerificationError("Tamanho do OpenAPI diverge do pin aprovado")
    if extracted.file_sha256 != hashlib.sha256(contract_bytes).hexdigest():
        raise ContractVerificationError("OpenAPI commitado difere dos bytes contidos no ZIP")

    args = [
        "--artifact-file",
        str(contract_path),
        "--receipt-file",
        str(receipt_path),
        "--expected-sha",
        EXPECTED_PIN["source"]["commit_sha"],
        "--mode",
        "verify-committed",
        "--expected-branch",
        "main",
        "--expected-workflow-name",
        EXPECTED_PIN["workflow"]["name"],
        "--expected-workflow-path",
        EXPECTED_PIN["workflow"]["path"],
        "--expected-workflow-id",
        str(EXPECTED_PIN["workflow"]["id"]),
        "--expected-artifact-name",
        EXPECTED_PIN["artifact"]["name"],
        "--allowed-events",
        EXPECTED_PIN["workflow"]["event"],
        "--owner",
        "yanpenalva",
        "--repo",
        "starter-kit-api",
    ]
    with redirect_stdout(StringIO()), redirect_stderr(StringIO()):
        status = run_cli(args)
    if status != 0:
        raise ContractVerificationError(
            "Receipt diverge da identidade, hash ou política de fonte aprovada"
        )


def main() -> int:
    try:
        verify_files(CONTRACT_PATH, RECEIPT_PATH, ARCHIVE_PATH, PIN_PATH)
    except OSError:
        print(
            "Falha fechada na verificação do contrato: faltam arquivos do bundle aprovado.",
            file=sys.stderr,
        )
        return 1
    except (ContractVerificationError, ValueError) as error:
        print(f"Falha fechada na verificação do contrato: {error}", file=sys.stderr)
        return 1
    print("Contrato aprovado verificado offline; nenhuma API remota foi consultada.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
