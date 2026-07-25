"""Process-local Python network guard for Graphify code-only extraction.

Loaded only by the graph-index child through its isolated PYTHONPATH.
"""

from __future__ import annotations

import errno
import os
import socket


def _deny(*_args, **_kwargs):
    raise PermissionError(errno.EPERM, "network disabled by SIRINX code-only policy")


if os.environ.get("SIRINX_NETWORK_GUARD") == "1":

    class _GuardedSocket(socket.socket):
        def connect(self, *_args, **_kwargs):
            return _deny()

        def connect_ex(self, *_args, **_kwargs):
            return errno.EPERM

    socket.socket = _GuardedSocket
    socket.create_connection = _deny
