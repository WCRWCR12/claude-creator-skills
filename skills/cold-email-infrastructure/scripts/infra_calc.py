"""Cold email infrastructure calculator. Usage:
python infra_calc.py --contacts 300 --touches 1 --google-cap 12 --ms-cap 5 --google-share 0.7 --rotation
"""
import argparse
import math

p = argparse.ArgumentParser()
p.add_argument("--contacts", type=int, required=True, help="unique contacts per month")
p.add_argument("--touches", type=int, default=1, help="emails per contact (initial + follow-ups)")
p.add_argument("--days", type=int, default=22, help="sending days per month")
p.add_argument("--google-share", type=float, default=1.0, help="share of volume on Google (rest Microsoft)")
p.add_argument("--google-cap", type=int, default=12, help="cold sends/day per Google inbox")
p.add_argument("--ms-cap", type=int, default=5, help="cold sends/day per Microsoft inbox")
p.add_argument("--google-per-domain", type=int, default=2)
p.add_argument("--ms-per-domain", type=int, default=49)
p.add_argument("--reply-rate", type=float, default=0.01)
p.add_argument("--positive", type=float, default=0.4, help="share of replies that are positive")
p.add_argument("--meeting-rate", type=float, default=0.5)
p.add_argument("--rotation", action="store_true", help="double for a warming batch B")
a = p.parse_args()

sends = a.contacts * a.touches
daily = sends / a.days
g_daily, m_daily = daily * a.google_share, daily * (1 - a.google_share)
g_in = math.ceil(g_daily / a.google_cap) if g_daily else 0
m_in = math.ceil(m_daily / a.ms_cap) if m_daily else 0
g_dom = math.ceil(g_in / a.google_per_domain) if g_in else 0
m_dom = math.ceil(m_in / a.ms_per_domain) if m_in else 0
mult = 2 if a.rotation else 1
replies = a.contacts * a.reply_rate

print(f"Sends/month {sends}, per day {daily:.1f}")
print(f"Google: {g_in*mult} inboxes on {g_dom*mult} domains | Microsoft: {m_in*mult} inboxes on {m_dom*mult} domains")
print(f"Total inboxes {(g_in+m_in)*mult}, domains {(g_dom+m_dom)*mult} (rotation={'on' if a.rotation else 'off'})")
print(f"Expected replies {replies:.1f}, positive {replies*a.positive:.1f}, meetings {replies*a.positive*a.meeting_rate:.1f}")
print("Warmup: 14 days warmup only, then cold 5/day rising +3-5 every 3-4 days to the cap. Placement test every 2 weeks.")
