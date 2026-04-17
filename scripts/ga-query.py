#!/usr/bin/env python3
"""GA4 Data API query tool for AI Tycoon.

Usage:
  python scripts/ga-query.py overview [--days 30]
  python scripts/ga-query.py events [--days 7]
  python scripts/ga-query.py funnel [--days 30]
  python scripts/ga-query.py retention [--days 30]
  python scripts/ga-query.py countries [--days 30]
  python scripts/ga-query.py raw --metrics activeUsers,sessions --dimensions country --days 7
"""
import argparse
import json
import os
import sys
from datetime import date, timedelta

from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    DateRange,
    Dimension,
    Metric,
    RunReportRequest,
)
from google.oauth2 import service_account

PROPERTY_ID = "528427024"
SA_PATH = os.path.expanduser("~/.claude/ai-paper-analytics-sa.json")


def client():
    creds = service_account.Credentials.from_service_account_file(SA_PATH)
    return BetaAnalyticsDataClient(credentials=creds)


def run(c, metrics, dimensions, days):
    req = RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        metrics=[Metric(name=m) for m in metrics],
        dimensions=[Dimension(name=d) for d in dimensions],
        date_ranges=[DateRange(start_date=f"{days}daysAgo", end_date="today")],
        limit=100,
    )
    return c.run_report(req)


def fmt(resp):
    dims = [h.name for h in resp.dimension_headers]
    mets = [h.name for h in resp.metric_headers]
    rows = []
    for r in resp.rows:
        row = {}
        for i, d in enumerate(dims):
            row[d] = r.dimension_values[i].value
        for i, m in enumerate(mets):
            row[m] = r.metric_values[i].value
        rows.append(row)
    return {"dimensions": dims, "metrics": mets, "rows": rows}


def cmd_overview(args):
    c = client()
    resp = run(
        c,
        ["activeUsers", "newUsers", "sessions", "averageSessionDuration", "screenPageViews"],
        [],
        args.days,
    )
    print(json.dumps(fmt(resp), indent=2, ensure_ascii=False))


def cmd_events(args):
    c = client()
    resp = run(c, ["eventCount"], ["eventName"], args.days)
    print(json.dumps(fmt(resp), indent=2, ensure_ascii=False))


def cmd_countries(args):
    c = client()
    resp = run(c, ["activeUsers", "sessions"], ["country"], args.days)
    print(json.dumps(fmt(resp), indent=2, ensure_ascii=False))


def cmd_retention(args):
    c = client()
    resp = run(
        c,
        ["activeUsers"],
        ["cohort", "cohortNthDay"],
        args.days,
    )
    print(json.dumps(fmt(resp), indent=2, ensure_ascii=False))


def cmd_funnel(args):
    """Simple event volume breakdown for tutorial/engagement funnel."""
    c = client()
    resp = run(c, ["eventCount", "totalUsers"], ["eventName"], args.days)
    print(json.dumps(fmt(resp), indent=2, ensure_ascii=False))


def cmd_raw(args):
    c = client()
    metrics = [m.strip() for m in args.metrics.split(",") if m.strip()]
    dimensions = [d.strip() for d in args.dimensions.split(",") if d.strip()] if args.dimensions else []
    resp = run(c, metrics, dimensions, args.days)
    print(json.dumps(fmt(resp), indent=2, ensure_ascii=False))


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    for name, fn in [
        ("overview", cmd_overview),
        ("events", cmd_events),
        ("countries", cmd_countries),
        ("retention", cmd_retention),
        ("funnel", cmd_funnel),
    ]:
        sp = sub.add_parser(name)
        sp.add_argument("--days", type=int, default=30)
        sp.set_defaults(func=fn)

    sp = sub.add_parser("raw")
    sp.add_argument("--metrics", required=True)
    sp.add_argument("--dimensions", default="")
    sp.add_argument("--days", type=int, default=30)
    sp.set_defaults(func=cmd_raw)

    args = p.parse_args()
    try:
        args.func(args)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        if "PERMISSION_DENIED" in str(e) or "403" in str(e):
            print(
                f"\n→ GA4 Admin → Property access management에서\n  '{SA_PATH}' 의 client_email을 Viewer로 추가하세요.\n  email: ai-paper-analytics@ai-paper-analytics.iam.gserviceaccount.com",
                file=sys.stderr,
            )
        sys.exit(1)


if __name__ == "__main__":
    main()
