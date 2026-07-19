//! L1 Facebook-group lead scanner — B4 Ronin roster expansion.
//! Implementation assigned to a swarm worker; see MASTER_PLAN B4.
//!
//! `FbGroupScanner` watches public Thai Facebook-group posts (the classic
//! "ค่าไฟแพง อยากติดโซลาร์" buying signal) and normalizes them into
//! [`sirinx_core::Lead`] so the standard pipeline can take over:
//!
//! ```text
//! fb post ─▶ FbGroupScanner(02,L1) ─▶ Jūnai(17,L2) ─▶ Kihei(26,L3) ─▶ Gengo(36,L4)
//! ```
//!
//! Input payload shape:
//! `{"post_id": "...", "author_name": "...", "message": "...",
//!   "phone"?: "...", "line_id"?: "...", "consent_marketing"?: bool}`
//!
//! The published `lead-scanned` envelope is byte-shape compatible with
//! [`crate::ronin::Kuranosuke`]'s output (a serialized `Lead`), so any L2
//! scorer can consume it unchanged. Pure function: no I/O, no network, no
//! clock.

use serde_json::Value;

use sirinx_core::{BusinessType, Consent, Interest, Lead, LeadDraft};

use crate::agent::{Agent, AgentError, AgentInput, AgentOutput};
use crate::roster::AgentId;

/// L1 scanner, roster id 02 (Perception). The roster table lists anchor
/// codenames only, so id 2 is intentionally unnamed there.
pub struct FbGroupScanner;

// --- lead-signal keywords ---------------------------------------------------

/// Thai solar-interest keywords. FB energy groups mix Thai and English, so
/// a lowercase latin alias is included; matching runs on the lowercased
/// message. "ค่าไฟ" alone qualifies: "my power bill is insane" is the
/// single most common buying signal in Thai solar groups.
const SOLAR_KEYWORDS: &[&str] = &["โซล่า", "โซลาร์", "แผงโซลาร์", "ค่าไฟ", "ประหยัดไฟ", "solar"];

/// Words that anchor a THB/month figure: the first plausible number within
/// `BILL_WINDOW_CHARS` after one of these is read as the monthly bill.
/// Longest first so "ค่าไฟฟ้า" is tried before its prefix "ค่าไฟ".
const BILL_CONTEXT_KEYWORDS: &[&str] = &["ค่าไฟฟ้า", "ค่าไฟ"];

/// Bare monthly-shorthand anchors ("เดือนละ 5 หมื่น") for posts that quote
/// a figure without spelling out ค่าไฟ next to it.
const MONTHLY_CONTEXT_KEYWORDS: &[&str] = &["เดือนละ", "ต่อเดือน", "ทุกเดือน"];

/// Look-ahead after a bill anchor, in chars. Thai posters usually put the
/// figure right after the keyword ("ค่าไฟเดือนละ 80,000"); 40 chars covers
/// polite fillers like "ประมาณ" without drifting into the next sentence.
const BILL_WINDOW_CHARS: usize = 40;

/// Thai magnitude words and their multipliers. Shorthand like "5 หมื่น" is
/// how Thais actually quote bills in groups; a bare number reads as plain
/// THB ("ค่าไฟ 80,000"). No prefix overlaps, so any match order is safe.
const BILL_UNIT_MULTIPLIERS: &[(&str, f64)] = &[
    ("หมื่น", 10_000.0),
    ("แสน", 100_000.0),
    ("พัน", 1_000.0),
    ("ล้าน", 1_000_000.0),
];

/// Plausibility band for a parsed monthly bill (THB). Anything outside is
/// treated as noise (dates, phone digits, counts) and ignored, so the
/// conservative default below is used instead.
const MIN_PLAUSIBLE_BILL_THB: f64 = 500.0;
const MAX_PLAUSIBLE_BILL_THB: f64 = 5_000_000.0;

/// Fallback monthly bill when the post states none. Conservative on
/// purpose: 15K sits below Jūnai's WARM threshold (20K THB), so
/// interest-only posts enter the funnel as Cold/nurture instead of burning
/// site-survey capacity on unqualified leads.
const DEFAULT_MONTHLY_BILL_THB: f64 = 15_000.0;

/// Area units accepted right after a number ("หลังคา 600 ตร.ม.").
const AREA_UNIT_KEYWORDS: &[&str] = &[
    "ตารางเมตร",
    "ตร.ม.",
    "ตร.ม",
    "ตรม",
    "sq.m.",
    "sq.m",
    "sqm",
    "m²",
];

/// Plausibility band for usable rooftop/carport area (m²): small shophouse
/// roof to large factory roof.
const MIN_PLAUSIBLE_AREA_SQM: f64 = 10.0;
const MAX_PLAUSIBLE_AREA_SQM: f64 = 50_000.0;

/// Fallback area when the post states none: a modest shophouse/SME
/// rooftop, keeping the L2 ROI screen small until a survey measures the
/// real roof.
const DEFAULT_AREA_SQM: f64 = 100.0;

/// Business-type keyword table; the earliest match in the message wins.
/// Only variants that exist in `sirinx_core::BusinessType` appear here,
/// and the fallback is `Other` — never guess a type the text doesn't
/// support (L2/L3 treat Other as unqualified for vertical plays).
const BUSINESS_KEYWORDS: &[(&str, BusinessType)] = &[
    ("โรงงาน", BusinessType::Factory),
    ("โกดัง", BusinessType::Warehouse),
    ("คลังสินค้า", BusinessType::Warehouse),
    ("โรงแรม", BusinessType::Hotel),
    ("รีสอร์ท", BusinessType::Hotel),
    ("โชว์รูม", BusinessType::Showroom),
    ("สำนักงาน", BusinessType::Office),
    ("ออฟฟิศ", BusinessType::Office),
    ("ร้านค้า", BusinessType::RetailStore),
    ("ร้านกาแฟ", BusinessType::RetailStore),
];

/// Optional add-on interests. Thai-first keywords; latin aliases are matched
/// on the lowercased message. `AiEms` has no safe short keyword, so it is
/// never inferred — conservative beats noisy.
const BESS_KEYWORDS: &[&str] = &["แบตเตอรี่", "กักเก็บ", "bess"];
const EV_KEYWORDS: &[&str] = &["รถไฟฟ้า", "ชาร์จรถ", "จุดชาร์จ"];
const CARPORT_KEYWORDS: &[&str] = &["โรงจอด", "ที่จอดรถ", "carport"];

/// Lead `source` tag for funnel analytics; names this scanner.
const SOURCE: &str = "fb_group";

// --- text heuristics (all pure) ----------------------------------------------

fn is_solar_lead(msg: &str) -> bool {
    SOLAR_KEYWORDS.iter().any(|k| msg.contains(k))
}

fn is_digit(c: char) -> bool {
    c.is_ascii_digit() || ('๐'..='๙').contains(&c)
}

/// Parse a leading number: ascii or Thai digits, grouping commas, one
/// decimal dot. Returns `(value, bytes consumed)`, or `None` when `text`
/// does not start with a digit. Thai digits are included because group
/// posters frequently type them ("ค่าไฟ ๘๐,๐๐๐").
fn parse_number_prefix(text: &str) -> Option<(f64, usize)> {
    let mut cleaned = String::new();
    let mut consumed = 0;
    let mut seen_dot = false;
    for c in text.chars() {
        match c {
            '0'..='9' => cleaned.push(c),
            '๐'..='๙' => {
                let digit = (c as u32 - '๐' as u32) as u8;
                cleaned.push((b'0' + digit) as char);
            }
            // Grouping comma and the first dot are part of the number.
            ',' if !cleaned.is_empty() && !seen_dot => {}
            '.' if !cleaned.is_empty() && !seen_dot => {
                seen_dot = true;
                cleaned.push('.');
            }
            _ => break,
        }
        consumed += c.len_utf8();
    }
    if cleaned.is_empty() {
        return None;
    }
    cleaned.parse::<f64>().ok().map(|v| (v, consumed))
}

/// First plausible bill figure inside a post-anchor window: a number whose
/// value (after an optional Thai magnitude unit) lands in the plausible
/// band. Implausible numbers are skipped, not clamped.
fn find_plausible_bill(window: &str) -> Option<f64> {
    let mut i = 0;
    while i < window.len() {
        let c = window[i..].chars().next()?;
        if is_digit(c) {
            if let Some((base, consumed)) = parse_number_prefix(&window[i..]) {
                let rest = window[i + consumed..].trim_start();
                let value = BILL_UNIT_MULTIPLIERS
                    .iter()
                    .find(|(unit, _)| rest.starts_with(unit))
                    .map_or(base, |(_, multiplier)| base * multiplier);
                if (MIN_PLAUSIBLE_BILL_THB..=MAX_PLAUSIBLE_BILL_THB).contains(&value) {
                    return Some(value);
                }
                i += consumed;
                continue;
            }
        }
        i += c.len_utf8();
    }
    None
}

/// Monthly bill in THB, anchored on bill/monthly context words so stray
/// numbers (dates, counts, phone digits) are not misread as money.
fn find_bill(msg: &str) -> Option<f64> {
    for ctx in BILL_CONTEXT_KEYWORDS
        .iter()
        .chain(MONTHLY_CONTEXT_KEYWORDS.iter())
    {
        let mut off = 0;
        while let Some(rel) = msg[off..].find(*ctx) {
            let after = off + rel + ctx.len();
            let window: String = msg[after..].chars().take(BILL_WINDOW_CHARS).collect();
            if let Some(value) = find_plausible_bill(&window) {
                return Some(value);
            }
            off = after;
        }
    }
    None
}

/// Usable area in m²: the first plausible number immediately followed by a
/// square-metre unit ("600 ตร.ม.", "1,200 sqm").
fn find_area(msg: &str) -> Option<f64> {
    let mut i = 0;
    while i < msg.len() {
        let c = msg[i..].chars().next()?;
        if is_digit(c) {
            if let Some((base, consumed)) = parse_number_prefix(&msg[i..]) {
                let rest = msg[i + consumed..].trim_start();
                if AREA_UNIT_KEYWORDS.iter().any(|u| rest.starts_with(u))
                    && (MIN_PLAUSIBLE_AREA_SQM..=MAX_PLAUSIBLE_AREA_SQM).contains(&base)
                {
                    return Some(base);
                }
                i += consumed;
                continue;
            }
        }
        i += c.len_utf8();
    }
    None
}

/// Earliest keyword match in the message wins; `Other` when nothing
/// matches (documented default — the safest variant for downstream L2/L3
/// vertical assumptions).
fn guess_business_type(msg: &str) -> BusinessType {
    BUSINESS_KEYWORDS
        .iter()
        .filter_map(|(kw, bt)| msg.find(*kw).map(|i| (i, *bt)))
        .min_by_key(|(i, _)| *i)
        .map(|(_, bt)| bt)
        .unwrap_or(BusinessType::Other)
}

/// Solar-rooftop interest is implied by the keyword that qualified the
/// post; storage / EV / carport are added only on explicit keywords.
fn detect_interests(msg: &str) -> Vec<Interest> {
    let mut interests = vec![Interest::SolarRooftop];
    if BESS_KEYWORDS.iter().any(|k| msg.contains(k)) {
        interests.push(Interest::Bess);
    }
    if EV_KEYWORDS.iter().any(|k| msg.contains(k)) {
        interests.push(Interest::EvCharging);
    }
    if CARPORT_KEYWORDS.iter().any(|k| msg.contains(k)) {
        interests.push(Interest::SolarCarport);
    }
    interests
}

impl Agent for FbGroupScanner {
    fn id(&self) -> AgentId {
        AgentId(2)
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
        let payload = &input.payload;

        let post_id = match payload.get("post_id") {
            Some(Value::String(s)) if !s.trim().is_empty() => s.clone(),
            Some(Value::Number(n)) => n.to_string(),
            _ => {
                return Err(AgentError::BadPayload(
                    "post_id must be a non-empty string or number".into(),
                ))
            }
        };
        // Some scrapers omit the author; it is summary metadata only and is
        // never analyzed, so a missing name degrades instead of failing.
        let author = payload
            .get("author_name")
            .and_then(Value::as_str)
            .filter(|s| !s.trim().is_empty())
            .unwrap_or("unknown");
        let message = match payload.get("message").and_then(Value::as_str) {
            Some(m) if !m.trim().is_empty() => m,
            _ => {
                return Err(AgentError::BadPayload(
                    "message must be a non-empty string".into(),
                ))
            }
        };
        let msg = message.to_lowercase();

        if !is_solar_lead(&msg) {
            return Err(AgentError::BadPayload(format!(
                "not a lead: no solar-interest keyword in fb post {post_id}"
            )));
        }

        let bill = find_bill(&msg);
        let area = find_area(&msg);
        let business_type = guess_business_type(&msg);
        let interests = detect_interests(&msg);

        // PDPA: posting in a public group is NOT marketing consent.
        // `marketing_contact` stays false unless the payload carries an
        // explicit opt-in (`consent_marketing: true`, e.g. captured by a
        // moderator DM flow). A phone number or LINE id in the post is a
        // contact hint only — never treated as consent, and never copied
        // into the Lead (LeadDraft intentionally carries no PII contact
        // fields), so downstream agents cannot leak it.
        let marketing_opt_in = payload
            .get("consent_marketing")
            .and_then(Value::as_bool)
            .unwrap_or(false);
        let has_contact = payload
            .get("phone")
            .and_then(Value::as_str)
            .is_some_and(|s| !s.trim().is_empty())
            || payload
                .get("line_id")
                .and_then(Value::as_str)
                .is_some_and(|s| !s.trim().is_empty());

        let draft = LeadDraft {
            business_type,
            monthly_electric_bill: bill.unwrap_or(DEFAULT_MONTHLY_BILL_THB),
            available_area_sqm: area.unwrap_or(DEFAULT_AREA_SQM),
            interest: interests,
            source: SOURCE.into(),
            consent: Consent {
                // Aggregated funnel analytics on publicly posted content is
                // this scanner's documented purpose; marketing stays opt-in.
                analytics: true,
                marketing_contact: marketing_opt_in,
            },
        };
        // Defaults are chosen above zero, so validation can only fail if a
        // future edit breaks that invariant — defensive map, not an
        // expected path.
        let lead = Lead::from_draft(draft)
            .map_err(|e| AgentError::BadPayload(format!("lead validation failed: {e}")))?;

        let summary = format!(
            "fb post {post_id} by {author}: solar lead ({business_type:?}, bill {:.0} THB{}, area {:.0} m²{}{})",
            lead.draft.monthly_electric_bill,
            if bill.is_some() { "" } else { " (default)" },
            lead.draft.available_area_sqm,
            if area.is_some() { "" } else { " (default)" },
            if has_contact { ", contact available" } else { "" },
        );

        // Byte-shape compatible with Kuranosuke: the serialized `Lead`
        // under the same `lead-scanned` event, so any L2 scorer consumes
        // this scanner's output unchanged.
        let payload =
            serde_json::to_value(&lead).map_err(|e| AgentError::BadPayload(e.to_string()))?;
        Ok(AgentOutput {
            summary,
            publish: Some(AgentInput {
                event: "lead-scanned".into(),
                payload,
            }),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ronin::{Junai, Kihei};
    use serde_json::json;

    fn post(message: &str) -> AgentInput {
        AgentInput {
            event: "fb-post-created".into(),
            payload: json!({
                "post_id": "1234567890",
                "author_name": "สมชาย ใจดี",
                "message": message,
            }),
        }
    }

    /// Assert the L1 envelope shape and unwrap the forwarded Lead.
    fn scanned_lead(out: &AgentOutput) -> Lead {
        let publish = out.publish.as_ref().expect("scanner forwards leads");
        assert_eq!(publish.event, "lead-scanned");
        serde_json::from_value(publish.payload.clone()).expect("payload must be a Lead")
    }

    #[test]
    fn happy_path_extracts_bill_area_and_type() {
        let out = FbGroupScanner
            .process(post(
                "ขอคำแนะนำหน่อยครับ โรงงานของผมค่าไฟเดือนละ 80,000 บาท \
                 อยากติดแผงโซลาร์บนหลังคา 600 ตร.ม.",
            ))
            .unwrap();
        let lead = scanned_lead(&out);
        assert_eq!(lead.draft.source, "fb_group");
        assert_eq!(lead.draft.business_type, BusinessType::Factory);
        assert_eq!(lead.draft.monthly_electric_bill, 80_000.0);
        assert_eq!(lead.draft.available_area_sqm, 600.0);
        assert!(lead.draft.interest.contains(&Interest::SolarRooftop));
        assert!(out.summary.contains("1234567890"));
    }

    #[test]
    fn thai_shorthand_and_thai_digits_bills_are_parsed() {
        let out = FbGroupScanner
            .process(post("ค่าไฟเดือนละ 5 หมื่น อยากลดด้วยโซล่า"))
            .unwrap();
        assert_eq!(scanned_lead(&out).draft.monthly_electric_bill, 50_000.0);

        let out = FbGroupScanner
            .process(post("โรงแรมค่าไฟ 2 แสนกว่าทุกเดือน สนใจโซลาร์"))
            .unwrap();
        let lead = scanned_lead(&out);
        assert_eq!(lead.draft.business_type, BusinessType::Hotel);
        assert_eq!(lead.draft.monthly_electric_bill, 200_000.0);

        // Thai digits with grouping commas.
        let out = FbGroupScanner
            .process(post("ค่าไฟ ๘๐,๐๐๐ โซลาร์ช่วยได้ไหม"))
            .unwrap();
        assert_eq!(scanned_lead(&out).draft.monthly_electric_bill, 80_000.0);
    }

    #[test]
    fn conservative_defaults_when_unstated() {
        let out = FbGroupScanner
            .process(post("อยากติดโซลาร์บ้าง แต่ยังไม่รู้เรื่องเลย"))
            .unwrap();
        let lead = scanned_lead(&out);
        assert_eq!(lead.draft.monthly_electric_bill, DEFAULT_MONTHLY_BILL_THB);
        assert_eq!(lead.draft.available_area_sqm, DEFAULT_AREA_SQM);
        assert_eq!(lead.draft.business_type, BusinessType::Other);

        // Behavior check on the conservative default: an interest-only
        // post must score Cold through Jūnai, never jumping the nurture
        // queue ahead of qualified bills.
        let scored = Junai.process(out.publish.expect("L1 forwards")).unwrap();
        assert_eq!(
            scored.publish.expect("L2 forwards").payload["temperature"],
            json!("cold")
        );
    }

    #[test]
    fn business_type_keywords_map_to_existing_variants() {
        let cases = [
            ("โกดังของเราค่าไฟแพง อยากลองโซลาร์", BusinessType::Warehouse),
            ("สำนักงานอยากประหยัดไฟด้วยโซล่า", BusinessType::Office),
            ("ร้านค้าสนใจแผงโซลาร์", BusinessType::RetailStore),
            ("อยากติดโซลาร์เฉยๆ", BusinessType::Other),
        ];
        for (msg, expected) in cases {
            let lead = scanned_lead(&FbGroupScanner.process(post(msg)).unwrap());
            assert_eq!(lead.draft.business_type, expected, "message: {msg}");
        }
    }

    #[test]
    fn addon_interests_are_detected() {
        let lead = scanned_lead(
            &FbGroupScanner
                .process(post("โรงงานอยากติดโซลาร์กับแบตเตอรี่กักเก็บ และจุดชาร์จรถไฟฟ้า"))
                .unwrap(),
        );
        assert!(lead.draft.interest.contains(&Interest::SolarRooftop));
        assert!(lead.draft.interest.contains(&Interest::Bess));
        assert!(lead.draft.interest.contains(&Interest::EvCharging));
    }

    #[test]
    fn non_lead_post_is_rejected() {
        let err = FbGroupScanner
            .process(post("วันนี้ขายของดีจัง ฝากติดตามด้วยนะคะ"))
            .unwrap_err();
        match err {
            AgentError::BadPayload(msg) => assert!(msg.starts_with("not a lead")),
            other => panic!("expected BadPayload, got {other:?}"),
        }
    }

    #[test]
    fn malformed_payload_is_rejected() {
        for payload in [
            json!({"author_name": "a", "message": "โซลาร์น่าสนใจ"}), // no post_id
            json!({"post_id": "1", "message": ""}),                // empty message
            json!({"post_id": "1", "message": 42}),                // wrong type
            json!("not an object"),
        ] {
            let err = FbGroupScanner
                .process(AgentInput {
                    event: "fb-post-created".into(),
                    payload,
                })
                .unwrap_err();
            assert!(
                matches!(err, AgentError::BadPayload(_)),
                "payload should be rejected: {err}"
            );
        }
    }

    #[test]
    fn marketing_consent_requires_explicit_opt_in() {
        // A phone number / LINE id in the post is NOT consent (PDPA).
        let mut input = post("โรงแรมค่าไฟแพงมาก อยากติดโซลาร์");
        input.payload["phone"] = json!("0812345678");
        input.payload["line_id"] = json!("somchai_hotel");
        let out = FbGroupScanner.process(input).unwrap();
        let lead = scanned_lead(&out);
        assert!(!lead.draft.consent.marketing_contact);
        assert!(lead.draft.consent.analytics);
        assert!(out.summary.contains("contact available"));

        // An explicit opt-in flag is honored.
        let mut input = post("อยากติดโซลาร์ครับ");
        input.payload["consent_marketing"] = json!(true);
        let lead = scanned_lead(&FbGroupScanner.process(input).unwrap());
        assert!(lead.draft.consent.marketing_contact);
    }

    #[test]
    fn output_feeds_junai_and_kihei_unchanged() {
        // Pipeline compatibility: this scanner's `lead-scanned` envelope
        // must score through the stock L2 and route through the stock L3.
        let scanned = FbGroupScanner
            .process(post("โรงงานค่าไฟเดือนละ 80,000 อยากติดโซลาร์"))
            .unwrap();
        let scored = Junai
            .process(scanned.publish.expect("L1 forwards"))
            .unwrap();
        let scored_payload = scored.publish.expect("L2 forwards").payload;
        assert_eq!(scored_payload["temperature"], json!("hot"));
        assert!(scored_payload["roi"]["estimatedKw"].as_f64().unwrap() > 0.0);

        let decided = Kihei
            .process(AgentInput {
                event: "lead-scored".into(),
                payload: scored_payload,
            })
            .unwrap();
        assert_eq!(
            decided.publish.expect("L3 forwards").payload["followUp"],
            json!("site_survey_proposal")
        );
    }
}
