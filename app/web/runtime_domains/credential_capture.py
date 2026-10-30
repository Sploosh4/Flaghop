"""Credential Capture operations exposed by the local application runtime.

Bindings use the domain implementations directly; adapters remain only where argument
translation is required. Runtime state is supplied by the owning WebRuntime instance.
"""

from __future__ import annotations

from app.web import runtime_credential_capture as web_runtime_credential_capture


class CredentialCaptureRuntime:
    get_workspace_credential_captures = web_runtime_credential_capture.get_workspace_credential_captures

    _default_credential_capture_config = staticmethod(web_runtime_credential_capture.default_credential_capture_config)

    _normalize_credential_capture_config = staticmethod(
        web_runtime_credential_capture.normalize_credential_capture_config
    )

    _dedupe_credential_hashes = staticmethod(web_runtime_credential_capture.dedupe_credential_hashes)

    _extract_credential_data = staticmethod(web_runtime_credential_capture.extract_credential_data)

    _normalize_credential_capture_source = staticmethod(
        web_runtime_credential_capture.normalize_credential_capture_source
    )

    _split_credential_principal = staticmethod(web_runtime_credential_capture.split_credential_principal)

    _extract_cleartext_password = staticmethod(web_runtime_credential_capture.extract_cleartext_password)

    _latest_credential_capture_session_locked = web_runtime_credential_capture.latest_credential_capture_session_locked

    _credential_capture_state_locked = web_runtime_credential_capture.credential_capture_state_locked

    save_credential_capture_config = web_runtime_credential_capture.save_credential_capture_config

    start_credential_capture_session_job = web_runtime_credential_capture.start_credential_capture_session_job

    stop_credential_capture_session = web_runtime_credential_capture.stop_credential_capture_session

    get_credential_capture_log_payload = web_runtime_credential_capture.get_credential_capture_log_payload

    _run_credential_capture_session = web_runtime_credential_capture.run_credential_capture_session

    _build_credential_capture_command = web_runtime_credential_capture.build_credential_capture_command

    _credential_capture_target_label = staticmethod(web_runtime_credential_capture.credential_capture_target_label)
