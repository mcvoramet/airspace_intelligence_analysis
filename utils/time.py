"""Time helper utilities for the Dash application."""

from __future__ import annotations

from datetime import datetime, timedelta


def floor_to_20(dt: datetime) -> datetime:
    """Floor a ``datetime`` to the nearest 20-minute boundary."""
    dt = dt.replace(second=0, microsecond=0, tzinfo=None)
    return dt - timedelta(minutes=(dt.minute % 20))
