"""Context variables for execution state that needs to propagate across thread boundaries."""

import io
from contextvars import ContextVar
from typing import Callable, Literal

# Single context variable that holds a dict containing:
# - 'callback': The progress callback function
# - 'buffer': The StringIO buffer capturing stdout/stderr
# This allows passing a single object across thread boundaries
progress_context: ContextVar[dict[str, io.StringIO | Callable] | None] = ContextVar(
    "progress_context", default=None
)

ExecutionMode = Literal["sync", "async"]
execution_mode_context: ContextVar[ExecutionMode] = ContextVar(
    "execution_mode_context", default="sync"
)
