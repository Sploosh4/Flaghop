"""Tool observation parsing: cloud."""

from __future__ import annotations

from typing import Any, Dict, List

from app.scheduler.observations.common import (
    _append_finding,
    _append_technology,
    _clean_text,
)
from app.scheduler.observations.constants import (
    _CLOUD_PUBLIC_EXPOSURE_MARKERS,
    _CLOUD_PUBLIC_NEGATION_MARKERS,
    _COSMOS_RISK_MARKERS,
    _MANAGED_DB_PUBLIC_ACCESS_MARKERS,
)


def _append_cloud_technologies_from_text(rows: List[Dict[str, Any]], value: Any, *, evidence: str = ""):
    text = _clean_text(value, 400)
    if not text:
        return
    lowered = text.lower()
    if any(token in lowered for token in ("amazon web services", "amazonaws.com", " aws ", "x-amz-")):
        _append_technology(rows, "Amazon Web Services", evidence=evidence or text)
    if any(
        token in lowered
        for token in ("s3.amazonaws.com", "amazon s3", "aws s3", "s3 bucket", "bucket.s3", "x-amz-bucket")
    ):
        _append_technology(rows, "Amazon S3", evidence=evidence or text)
    if any(
        token in lowered
        for token in ("microsoft azure", " azure ", "blob.core.windows.net", "dfs.core.windows.net", "x-ms-")
    ):
        _append_technology(rows, "Microsoft Azure", evidence=evidence or text)
    if any(
        token in lowered
        for token in ("blob.core.windows.net", "dfs.core.windows.net", "azure blob", "azure storage", "x-ms-blob")
    ):
        _append_technology(rows, "Azure Blob Storage", evidence=evidence or text)
    if any(
        token in lowered
        for token in (
            "google cloud",
            "googleapis.com",
            "storage.googleapis.com",
            "storage.cloud.google.com",
            "x-goog-",
            " gcp ",
        )
    ):
        _append_technology(rows, "Google Cloud Platform", evidence=evidence or text)
    if any(
        token in lowered
        for token in (
            "storage.googleapis.com",
            "storage.cloud.google.com",
            "google cloud storage",
            "gcs bucket",
            "x-goog-",
        )
    ):
        _append_technology(rows, "Google Cloud Storage", evidence=evidence or text)
    if any(token in lowered for token in ("rds.amazonaws.com", "amazon rds", "aws rds", "relational database service")):
        _append_technology(rows, "Amazon RDS", evidence=evidence or text)
    if any(token in lowered for token in ("amazon aurora", "aws aurora", "aurora mysql", "aurora postgresql")) or (
        "rds.amazonaws.com" in lowered and any(token in lowered for token in (".cluster-", ".cluster-ro-", "aurora"))
    ):
        _append_technology(rows, "Amazon Aurora", evidence=evidence or text)
    if any(
        token in lowered
        for token in (
            "azure cosmos",
            "cosmos db",
            "cosmosdb",
            "documents.azure.com",
            "mongo.cosmos.azure.com",
            "cassandra.cosmos.azure.com",
            "gremlin.cosmos.azure.com",
            "table.cosmos.azure.com",
        )
    ):
        _append_technology(rows, "Azure Cosmos DB", evidence=evidence or text)
    if any(token in lowered for token in ("google cloud sql", "cloudsql", "sqladmin.googleapis.com")):
        _append_technology(rows, "Google Cloud SQL", evidence=evidence or text)


def _append_cloud_exposure_findings_from_text(rows: List[Dict[str, Any]], value: Any, *, evidence: str = ""):
    text = _clean_text(value, 520)
    if not text:
        return
    lowered = text.lower()
    if any(token in lowered for token in _CLOUD_PUBLIC_NEGATION_MARKERS):
        return

    aws_storage = any(
        token in lowered for token in ("s3.amazonaws.com", "amazon s3", "aws s3", "s3 bucket", "bucket.s3")
    )
    azure_storage = any(
        token in lowered for token in ("blob.core.windows.net", "dfs.core.windows.net", "azure blob", "azure storage")
    )
    gcp_storage = any(
        token in lowered
        for token in ("storage.googleapis.com", "storage.cloud.google.com", "google cloud storage", "gcs bucket")
    )
    rds = any(
        token in lowered for token in ("rds.amazonaws.com", "amazon rds", "aws rds", "relational database service")
    )
    aurora = any(
        token in lowered for token in ("amazon aurora", "aws aurora", "aurora mysql", "aurora postgresql")
    ) or ("rds.amazonaws.com" in lowered and any(token in lowered for token in (".cluster-", ".cluster-ro-", "aurora")))
    cosmos = any(
        token in lowered
        for token in (
            "azure cosmos",
            "cosmos db",
            "cosmosdb",
            "documents.azure.com",
            "mongo.cosmos.azure.com",
            "cassandra.cosmos.azure.com",
            "gremlin.cosmos.azure.com",
            "table.cosmos.azure.com",
        )
    )
    cloudsql = any(token in lowered for token in ("google cloud sql", "cloudsql", "sqladmin.googleapis.com"))
    publicish = any(token in lowered for token in _CLOUD_PUBLIC_EXPOSURE_MARKERS)
    managed_public = any(token in lowered for token in _MANAGED_DB_PUBLIC_ACCESS_MARKERS)
    cosmos_risk = any(token in lowered for token in _COSMOS_RISK_MARKERS)

    if aws_storage and publicish:
        _append_finding(rows, "Potential public Amazon S3 exposure", severity="medium", evidence=evidence or text)
    if azure_storage and publicish:
        _append_finding(
            rows, "Potential public Azure Blob Storage exposure", severity="medium", evidence=evidence or text
        )
    if gcp_storage and publicish:
        _append_finding(
            rows, "Potential public Google Cloud Storage exposure", severity="medium", evidence=evidence or text
        )
    if rds and managed_public:
        _append_finding(rows, "Potential public Amazon RDS exposure", severity="low", evidence=evidence or text)
    if aurora and managed_public:
        _append_finding(rows, "Potential public Amazon Aurora exposure", severity="low", evidence=evidence or text)
    if cosmos and cosmos_risk:
        _append_finding(rows, "Potential public Azure Cosmos DB exposure", severity="medium", evidence=evidence or text)
    if cloudsql and managed_public:
        _append_finding(rows, "Potential public Google Cloud SQL exposure", severity="low", evidence=evidence or text)
