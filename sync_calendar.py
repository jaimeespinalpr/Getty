#!/usr/bin/env python3
"""
sync_calendar.py — Sincroniza la disponibilidad del Ghetty Motor-Home
entre Airbnb y la web (sincronización bidireccional vía iCal).

Entrada:
  - Variable de entorno AIRBNB_ICAL_URL (opcional):
    URL de exportación iCal del calendario de Airbnb.
    (Airbnb → Calendario → Disponibilidad → Conectar otro calendario → Exportar)
  - bookings.json: reservas hechas en la web, mantenidas por el dueño.

Salida:
  - availability.json: lista combinada de fechas ocupadas (Airbnb + web).
    La web la usa para bloquear fechas en el calendario de reservas.
  - ghetty-web-bookings.ics: calendario iCal con las reservas de la web,
    para IMPORTARLO en Airbnb y que Airbnb también bloquee esas fechas.

Así, una fecha reservada en cualquiera de las dos plataformas queda
bloqueada en ambas y nadie puede rentar el mismo día dos veces.
"""

import json
import os
import re
import sys
import urllib.request
from datetime import date, datetime, timedelta, timezone

AIRBNB_ICAL_URL = os.environ.get("AIRBNB_ICAL_URL", "").strip()
BOOKINGS_FILE = "bookings.json"
AVAILABILITY_FILE = "availability.json"
EXPORT_ICS_FILE = "ghetty-web-bookings.ics"


def parse_ics_date(value: str):
    """Acepta DTSTART;VALUE=DATE:20260701 o DTSTART:20260701T150000Z."""
    value = value.strip()
    m = re.match(r"(\d{4})(\d{2})(\d{2})", value)
    if not m:
        return None
    return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))


def fetch_airbnb_blocked_dates(url: str) -> set:
    """Descarga el iCal de Airbnb y devuelve el set de fechas ocupadas."""
    req = urllib.request.Request(url, headers={"User-Agent": "GhettyCalendarSync/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        ics = resp.read().decode("utf-8", errors="replace")

    blocked = set()
    # Eventos VEVENT con DTSTART/DTEND (DTEND es exclusivo en iCal)
    for event in re.findall(r"BEGIN:VEVENT(.*?)END:VEVENT", ics, re.DOTALL):
        start_m = re.search(r"DTSTART[^:]*:([^\r\n]+)", event)
        end_m = re.search(r"DTEND[^:]*:([^\r\n]+)", event)
        if not start_m:
            continue
        start = parse_ics_date(start_m.group(1))
        end = parse_ics_date(end_m.group(1)) if end_m else (start + timedelta(days=1) if start else None)
        if not start or not end:
            continue
        day = start
        while day < end:
            blocked.add(day)
            day += timedelta(days=1)
    return blocked


def load_web_bookings() -> list:
    if not os.path.exists(BOOKINGS_FILE):
        return []
    with open(BOOKINGS_FILE, encoding="utf-8") as f:
        data = json.load(f)
    return data.get("bookings", [])


def web_booking_dates(bookings: list) -> set:
    """Fechas ocupadas por reservas web. 'end' = checkout (exclusivo)."""
    blocked = set()
    for b in bookings:
        try:
            start = date.fromisoformat(b["start"])
            end = date.fromisoformat(b.get("end", b["start"]))
        except (KeyError, ValueError, TypeError, AttributeError) as exc:
            print(f"⚠️  Reserva inválida ignorada: {b} ({exc})")
            continue
        if end <= start:
            end = start + timedelta(days=1)
        day = start
        while day < end:
            blocked.add(day)
            day += timedelta(days=1)
    return blocked


def write_availability(blocked: set, sources: list):
    payload = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "+".join(sources) if sources else "none",
        "booked": sorted(d.isoformat() for d in blocked),
    }
    with open(AVAILABILITY_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"✅ {AVAILABILITY_FILE}: {len(blocked)} fechas bloqueadas.")


def write_export_ics(bookings: list):
    """Genera el iCal con reservas web para importar en Airbnb."""
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Ghetty Motor-Home//Web Bookings//ES",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "X-WR-CALNAME:Ghetty Motor-Home — Reservas Web",
    ]
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    for b in bookings:
        try:
            start = date.fromisoformat(b["start"])
            end = date.fromisoformat(b.get("end", b["start"]))
        except (KeyError, ValueError, TypeError, AttributeError):
            continue
        if end <= start:
            end = start + timedelta(days=1)
        uid = b.get("id") or f"{start.isoformat()}-{end.isoformat()}"
        lines += [
            "BEGIN:VEVENT",
            f"UID:{uid}@ghettymotorhome.web",
            f"DTSTAMP:{stamp}",
            f"DTSTART;VALUE=DATE:{start.strftime('%Y%m%d')}",
            f"DTEND;VALUE=DATE:{end.strftime('%Y%m%d')}",
            "SUMMARY:Reservado (web Ghetty)",
            "END:VEVENT",
        ]
    lines.append("END:VCALENDAR")
    with open(EXPORT_ICS_FILE, "w", encoding="utf-8") as f:
        f.write("\r\n".join(lines) + "\r\n")
    print(f"✅ {EXPORT_ICS_FILE}: {len(bookings)} reservas web exportadas.")


def main():
    sources = []
    blocked = set()

    web = load_web_bookings()
    if web:
        sources.append("web")
    blocked |= web_booking_dates(web)

    if AIRBNB_ICAL_URL:
        try:
            airbnb = fetch_airbnb_blocked_dates(AIRBNB_ICAL_URL)
            blocked |= airbnb
            sources.append("airbnb")
            print(f"✅ Airbnb: {len(airbnb)} fechas ocupadas.")
        except Exception as exc:
            print(f"❌ Error descargando iCal de Airbnb: {exc}")
            # No abortamos: publicamos al menos las reservas web
    else:
        print("ℹ️  AIRBNB_ICAL_URL no configurado — solo se usan reservas web.")

    write_availability(blocked, sources)
    write_export_ics(web)


if __name__ == "__main__":
    sys.exit(main())
