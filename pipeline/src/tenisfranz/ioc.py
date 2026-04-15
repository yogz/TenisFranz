"""IOC country code → ISO 3166-1 alpha-2 (for flag emoji).

Limited to the set of countries likely to produce tour-level tennis players —
any unknown IOC code falls back to None.
"""

from __future__ import annotations

IOC_TO_ISO: dict[str, str] = {
    "ARG": "AR", "AUS": "AU", "AUT": "AT", "BAH": "BS", "BAR": "BB",
    "BEL": "BE", "BIH": "BA", "BLR": "BY", "BOL": "BO", "BRA": "BR",
    "BUL": "BG", "CAN": "CA", "CHI": "CL", "CHN": "CN", "COL": "CO",
    "CRO": "HR", "CUB": "CU", "CYP": "CY", "CZE": "CZ", "DEN": "DK",
    "DOM": "DO", "ECU": "EC", "EGY": "EG", "ESA": "SV", "ESP": "ES",
    "EST": "EE", "FIN": "FI", "FRA": "FR", "GBR": "GB", "GEO": "GE",
    "GER": "DE", "GRE": "GR", "GUA": "GT", "HKG": "HK", "HUN": "HU",
    "INA": "ID", "IND": "IN", "IRI": "IR", "IRL": "IE", "ISR": "IL",
    "ISV": "VI", "ITA": "IT", "JAM": "JM", "JPN": "JP", "KAZ": "KZ",
    "KGZ": "KG", "KOR": "KR", "KOS": "XK", "KSA": "SA", "KUW": "KW",
    "LAT": "LV", "LBN": "LB", "LIB": "LY", "LIE": "LI", "LTU": "LT",
    "LUX": "LU", "MAD": "MG", "MAR": "MA", "MAS": "MY", "MDA": "MD",
    "MEX": "MX", "MKD": "MK", "MNE": "ME", "MON": "MC", "NAM": "NA",
    "NED": "NL", "NGR": "NG", "NOR": "NO", "NZL": "NZ", "PAK": "PK",
    "PAR": "PY", "PER": "PE", "PHI": "PH", "POL": "PL", "POR": "PT",
    "PUR": "PR", "QAT": "QA", "ROU": "RO", "RSA": "ZA", "RUS": "RU",
    "SLO": "SI", "SMR": "SM", "SRB": "RS", "SUI": "CH", "SVK": "SK",
    "SWE": "SE", "SYR": "SY", "THA": "TH", "TPE": "TW", "TUN": "TN",
    "TUR": "TR", "UAE": "AE", "UKR": "UA", "URU": "UY", "USA": "US",
    "UZB": "UZ", "VEN": "VE", "VIE": "VN", "ZIM": "ZW",
}


def ioc_to_iso(ioc: str | None) -> str | None:
    if not ioc:
        return None
    return IOC_TO_ISO.get(ioc.upper())
