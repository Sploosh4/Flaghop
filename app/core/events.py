"""Small synchronous callback hooks for backend operations, independent of a UI toolkit."""

import logging


class EventHook:
    def __init__(self):
        self._callbacks = []

    def connect(self, callback):
        if not callable(callback):
            raise TypeError("Event callback must be callable")
        self._callbacks.append(callback)

    def emit(self, *args, **kwargs):
        for callback in tuple(self._callbacks):
            try:
                callback(*args, **kwargs)
            except Exception:
                logging.getLogger(__name__).exception("Backend event callback failed")
