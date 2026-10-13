from __future__ import annotations

from contextlib import redirect_stderr, redirect_stdout
import hashlib
import importlib
from io import StringIO
import json
from pathlib import Path
import sys
from types import ModuleType
from typing import TypedDict

ROOT = Path(__file__).resolve().parents[1]
OPENAPI = ROOT / "openapi"
PIN_PATH = OPENAPI / "contract-pin.json"
CONTRACT_PATH = OPENAPI / "openapi.json"
RECEIPT_PATH = OPENAPI / "receipt.json"
ARCHIVE_PATH = OPENAPI / "artifact.zip"
VERIFIER_PATH = ROOT / "scripts/vendor/openapi-contract"

class SourcePin(TypedDict):
    repository: str
    commit_sha: str
    branch: str


class WorkflowPin(TypedDict):
    name: str
    path: str
    id: int
    event: str


class RunPin(TypedDict):
    id: int
    attempt: int
    status: str
    conclusion: str


class ArtifactPin(TypedDict):
    id: int
    name: str
    archive_file: str
    archive_bytes: int
    archive_sha256: str
    contract_file: str
    contract_bytes: int
    contract_sha256: str


class VerificationPin(TypedDict):
    mode: str
    max_age_days_for_download: int
    clock_skew_seconds_for_download: int
    max_archive_bytes: int
    max_contract_bytes: int
    duplicate_json_keys: str
    external_refs: str
    committed_snapshot_expiration: str


class ExpectedPin(TypedDict):
    schema_version: int
    policy_source: str
    source: SourcePin
    workflow: WorkflowPin
    run: RunPin
    artifact: ArtifactPin
    verification: VerificationPin


EXPECTED_PIN: ExpectedPin = {
    "schema_version": 1,
    "policy_source": "User authorization in FE W2 integration request, 2026-10-13",
    "source": {
        "repository": "yanpenalva/starter-kit-api",
        "commit_sha": "ec14bab9a24fe2641bb41b927f40365cf8a12af2",
        "branch": "main",
    },
    "workflow": {
        "name": "OpenAPI Contract",
        "path": ".github/workflows/openapi.yml",
        "id": 374937885,
        "event": "workflow_dispatch",
    },
    "run": {
        "id": 38409872620,
        "attempt": 1,
        "status": "completed",
        "conclusion": "success",
    },
    "artifact": {
        "id": 11821515121,
        "name": "openapi-ec14bab9a24fe2641bb41b927f40365cf8a12af2",
        "archive_file": "artifact.zip",
        "archive_bytes": 7941,
        "archive_sha256": "bf345edba35d3e6bd82404786b8649cb822e883d6703ae4069bff43554a080c0",
        "contract_file": "openapi.json",
        "contract_bytes": 159585,
        "contract_sha256": "9f3c72cb17878c79d112cfbdf07e982eeddb7d9774df776d610f4f3aefaf91a9",
    },
    "verification": {
        "mode": "verify-committed",
        "max_age_days_for_download": 90,
        "clock_skew_seconds_for_download": 300,
        "max_archive_bytes": 10485760,
        "max_contract_bytes": 262144,
        "duplicate_json_keys": "reject",
        "external_refs": "reject",
        "committed_snapshot_expiration": "not-applied",
    },
}

RECEIPT_PIN_FIELDS: dict[str, object] = {
    "repository": EXPECTED_PIN["source"]["repository"],
    "commit_sha": EXPECTED_PIN["source"]["commit_sha"],
    "head_branch": EXPECTED_PIN["source"]["branch"],
    "workflow_name": EXPECTED_PIN["workflow"]["name"],
    "workflow_path": EXPECTED_PIN["workflow"]["path"],
    "workflow_id": EXPECTED_PIN["workflow"]["id"],
    "event": EXPECTED_PIN["workflow"]["event"],
    "run_id": EXPECTED_PIN["run"]["id"],
    "run_attempt": EXPECTED_PIN["run"]["attempt"],
    "artifact_id": EXPECTED_PIN["artifact"]["id"],
    "artifact_name": EXPECTED_PIN["artifact"]["name"],
    "artifact_size_bytes": EXPECTED_PIN["artifact"]["archive_bytes"],
    "artifact_file_bytes": EXPECTED_PIN["artifact"]["contract_bytes"],
    "archive_sha256": EXPECTED_PIN["artifact"]["archive_sha256"],
    "artifact_file_sha256": EXPECTED_PIN["artifact"]["contract_sha256"],
}


class ContractVerificationError(ValueError):
    pass


def verifier_module(name: str) -> ModuleType:
    verifier_root = str(VERIFIER_PATH)
    if verifier_root not in sys.path:
        sys.path.insert(0, verifier_root)
    return importlib.import_module(name)


def strict_json(payload: bytes, description: str) -> object:
    try:
        duplicate_hook = verifier_module("contract_core").check_duplicate_keys
        return json.loads(payload.decode("utf-8"), object_pairs_hook=duplicate_hook)
    except Exception as error:
        raise ContractVerificationError(
            f"JSON inválido ou com chaves duplicadas em {description}"
        ) from error


def strict_json_equal(actual: object, expected: object) -> bool:
    matches = type(actual) is type(expected)
    if matches and isinstance(actual, dict) and isinstance(expected, dict):
        matches = actual.keys() == expected.keys()
        if matches:
            for key, value in actual.items():
                matches = matches and strict_json_equal(value, expected[key])
    if matches and isinstance(actual, list) and isinstance(expected, list):
        matches = len(actual) == len(expected)
        if matches:
            for index, value in enumerate(actual):
                matches = matches and strict_json_equal(value, expected[index])
    if matches and not isinstance(actual, (dict, list)):
        matches = actual == expected
    return matches


def validate_receipt_pin(receipt: object) -> None:
    if not isinstance(receipt, dict):
        raise ContractVerificationError("Receipt precisa ser um objeto JSON")
    for field, expected in RECEIPT_PIN_FIELDS.items():
        if field not in receipt:
            raise ContractVerificationError(f"Receipt sem campo obrigatório: {field}")
        if not strict_json_equal(receipt[field], expected):
            raise ContractVerificationError(f"Receipt diverge do pin no campo: {field}")
    if "run_url" not in receipt or not isinstance(receipt["run_url"], str):
        raise ContractVerificationError("Receipt sem URL canônica da execução")
    repository = receipt["repository"]
    run_id = receipt["run_id"]
    if not isinstance(repository, str) or type(run_id) is not int:
        raise ContractVerificationError("Receipt contém tipo inválido na identidade da execução")
    run_attempt = receipt["run_attempt"]
    if type(run_attempt) is not int:
        raise ContractVerificationError("Receipt contém tipo inválido em run_attempt")
    expected_url = f"https://github.com/{repository}/actions/runs/{run_id}"
    actual_url = receipt["run_url"]
    if actual_url != expected_url:
        attempt_prefix = f"{expected_url}/attempts/"
        if actual_url.startswith(attempt_prefix):
            suffix = actual_url[len(attempt_prefix) :]
            if suffix != str(run_attempt):
                raise ContractVerificationError("URL do run_attempt diverge do pin")
        raise ContractVerificationError("URL do run não corresponde à identidade pinada")


def validate_local_refs(document: object) -> None:
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
    max_contract_bytes = EXPECTED_PIN["verification"]["max_contract_bytes"]

    pin_bytes = core.read_bounded_bytes(pin_path, 65536, "Pin manifest")
    pin = strict_json(pin_bytes, "manifesto de pin")
    if not strict_json_equal(pin, EXPECTED_PIN):
        raise ContractVerificationError("Manifesto de pin diverge da política aprovada")

    receipt_bytes = core.read_bounded_bytes(
        receipt_path,
        core.MAX_RECEIPT_BYTES,
        "Receipt",
    )
    receipt = strict_json(receipt_bytes, "receipt")
    validate_receipt_pin(receipt)

    contract_bytes = core.read_bounded_bytes(
        contract_path, max_contract_bytes, "Contract"
    )
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
                max_file_bytes=max_contract_bytes,
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
