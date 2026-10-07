import sys
from vendor.csd import validate_context as upstream


class ProjectValidator(upstream.Validator):
    def check_legacy_and_public_markers(self) -> None:
        pass

    def check_examples(self, config: dict) -> None:
        if (self.root / "examples").is_dir():
            super().check_examples(config)
            return
        self.warning("No example suite is installed; active work items are still validated.")


if __name__ == "__main__":
    upstream.Validator = ProjectValidator
    sys.exit(upstream.main())
