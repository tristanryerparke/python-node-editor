try:
    from pne_image import image_cached_datatype
except ImportError as exc:  # pragma: no cover - exercised only without plugin installed
    raise ImportError(
        "Image support requires the pne-plugin-image package. "
        "Install it with: uv add pne-plugin-image"
    ) from exc

__all__ = ["image_cached_datatype"]
