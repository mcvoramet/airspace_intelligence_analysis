"""Database connection utilities for the Dash application."""

from __future__ import annotations

import os

import pandas as pd
import pyodbc

try:  # pragma: no cover - environment loading is side effect
    from dotenv import load_dotenv
    load_dotenv()
except Exception:  # pragma: no cover - dotenv not installed
    pass

DB_DRIVER = os.getenv("MSSQL_DRIVER", "ODBC Driver 18 for SQL Server")
DB_SERVER = os.getenv("MSSQL_SERVER", "localhost,1433")
DB_DATABASE = os.getenv("MSSQL_DATABASE", "ATFAS")
DB_UID = os.getenv("MSSQL_UID", "sa")
DB_PWD = os.getenv("MSSQL_PWD", "YourStrong(!)Password")

CONNECTION = (
    f"DRIVER={{{DB_DRIVER}}};"
    f"SERVER={DB_SERVER};"
    f"DATABASE={DB_DATABASE};"
    f"UID={DB_UID};PWD={DB_PWD};"
    "Encrypt=yes;TrustServerCertificate=yes;Connection Timeout=10;"
)


def sql_query(query: str, params: tuple | None = None) -> pd.DataFrame:
    """Execute an SQL query and return the results as a DataFrame.

    Parameters
    ----------
    query:
        SQL query string to execute.
    params:
        Optional sequence of parameters to pass to the query.

    Returns
    -------
    pandas.DataFrame
        Data returned by the server.
    """
    with pyodbc.connect(CONNECTION) as conn:
        return pd.read_sql(query, conn, params=params)
