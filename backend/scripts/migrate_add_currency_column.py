"""Idempotent migration: add the `currency` column to the `events` table.

`Base.metadata.create_all` only creates missing tables — it does not alter an
existing one. Pre-existing dev databases (the SQLite `platform_dev.db`, or a
Postgres `event_db`) therefore need this column added manually:

    currency  VARCHAR(3)  NOT NULL DEFAULT 'INR'

Run once after pulling the schema change:

    python backend/scripts/migrate_add_currency_column.py

The script is safe to run repeatedly — an existing column is skipped, and the
backfill only touches rows still holding the INR default.

Backfill: every existing row defaults to INR (the platform's home currency),
EXCEPT aggregated events, whose prices came from the provider in a real foreign
currency. Ticketmaster's Discovery API quotes US events in USD, so leaving those
rows at INR would relabel a $45 concert ticket as ₹45. They are set to USD here.
"""
import os
import sys

from sqlalchemy import create_engine, inspect, text

# Aggregated sources whose prices are NOT in the platform's home currency,
# mapped to the currency the provider actually quotes. Add a row here when a
# new aggregator is wired up, or its prices will be mislabelled as rupees.
SOURCE_CURRENCY = {
    "ticketmaster": "USD",
}


def _resolve_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    # Mirror shadow_runner.py: shared SQLite db at the backend/ root.
    backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_path = os.path.join(backend_dir, "platform_dev.db")
    return f"sqlite:///{db_path}"


def main() -> int:
    database_url = _resolve_database_url()
    engine = create_engine(database_url)
    dialect = engine.dialect.name  # "sqlite" | "postgresql" | ...

    inspector = inspect(engine)
    if "events" not in inspector.get_table_names():
        print(
            "events table does not exist yet — nothing to migrate. "
            "Start the event service once to create it, then re-run."
        )
        return 0

    existing = {col["name"] for col in inspector.get_columns("events")}
    has_source = "source" in existing

    with engine.begin() as conn:
        if "currency" in existing:
            print("  = column already present: currency")
        else:
            conn.execute(
                text(
                    "ALTER TABLE events ADD COLUMN currency "
                    "VARCHAR(3) NOT NULL DEFAULT 'INR'"
                )
            )
            print("  + added column: currency (default 'INR')")

        # Existing rows predate the column's default, so NULL them into INR
        # first — SQLite's ALTER backfills the default, Postgres does too, but
        # a row inserted by an older client can still carry NULL.
        conn.execute(
            text("UPDATE events SET currency = 'INR' WHERE currency IS NULL OR currency = ''")
        )

        if not has_source:
            print(
                "  ! no `source` column — skipping the aggregated-event backfill. "
                "Run migrate_add_source_columns.py first if you sync Ticketmaster."
            )
        else:
            for source, code in SOURCE_CURRENCY.items():
                result = conn.execute(
                    text(
                        "UPDATE events SET currency = :code "
                        "WHERE source = :source AND currency = 'INR'"
                    ),
                    {"code": code, "source": source},
                )
                if result.rowcount:
                    print(f"  ~ backfilled {result.rowcount} {source} row(s) to {code}")

    print(f"Database: {database_url}  (dialect: {dialect})")
    print("Migration complete.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
