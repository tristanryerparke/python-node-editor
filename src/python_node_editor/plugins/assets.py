from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class FrontendPluginAsset:
    id: str
    asset_dir: Path
    js: str
    css: str | None = None

    def serialize(self) -> dict[str, str]:
        base_url = f"/plugin-assets/{self.id}"
        data = {
            "id": self.id,
            "js": f"{base_url}/{self.js}",
        }
        if self.css is not None:
            data["css"] = f"{base_url}/{self.css}"
        return data
