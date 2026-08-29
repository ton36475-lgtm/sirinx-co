//! L1 LINE-OA event lead scanner — B4 Ronin roster expansion.
//!
//! [`LineEventsScanner`] (AgentId 3, L1 Perception) turns one LINE
//! Messaging API webhook event into a [`sirinx_core::Lead`] and publishes
//! the same `lead-scanned` envelope as [`crate::ronin::Kuranosuke`], so
//! any L2 scorer (e.g. [`crate::ronin::Junai`]) consumes it unchanged.
//!
//! Input payload shape (single webhook event object):
//!
//! ```json
//! {"type":"message","source":{"userId":"U…"},"message":{"type":"text","text":"…"}}
//! ```
//!
//! Anything else — non-`message` events (`follow`, `postback`, …) or
//! non-`text` messages (`image`, `sticker`, …) — is `Err(BadPayload)`.
//!
//! ## Thai text parsing rules (bill / area hints)
//!
//! 1. **Normalization.** Thai digits `๐-๙` map to ASCII `0-9`; commas
//!    *between two digits* are dropped (`80,000` → `80000`); ASCII is
//!    lowercased for keyword matching. Nothing else is touched.
//! 2. **Number scan.** A number is a run of digits with at most one
//!    decimal point (`1.5`). A Thai magnitude word directly after the
//!    number (spaces allowed) multiplies it: `หมื่น` ×10⁴, `แสน` ×10⁵,
//!    `ล้าน` ×10⁶ (`2 แสน` → 200,000). Without a magnitude word the
//!    digits stand alone (`80,000` → 80,000).
//! 3. **Bill.** The first number appearing within [`BILL_WINDOW_CHARS`]
//!    chars *after* a bill keyword (`ค่าไฟ`, also matches `ค่าไฟฟ้า`) is
//!    the monthly bill in THB. Numbers not anchored to the keyword
//!    (phone fragments, counts, dates) are never treated as bills.
//! 4. **Area.** The number directly *before* an area unit marker
//!    (`ตารางเมตร`, `ตร.ม.`, `ตรม`) within [`AREA_WINDOW_CHARS`] chars is
//!    the area in m²; if no unit is found, the first number *after* an
//!    area noun (`พื้นที่`, `หลังคา`) is used instead.
//! 5. **Missing hints** fall back to [`DEFAULT_MONTHLY_BILL_THB`] /
//!    [`DEFAULT_AREA_SQM`] and the summary flags them as `default` —
//!    conservative values, never hot-lead material.
//!
//! ## PDPA / consent
//!
//! `analytics` is always `true` (the user initiated a service
//! conversation with the OA). `marketing_contact` is `true` **only** when
//! the text explicitly asks to be contacted (see
//! [`CONTACT_REQUEST_KEYWORDS`]); it is never inferred from interest
//! alone. `source.userId` is personal data: the summary notes its
//! *presence* only — it is never copied into the lead and never invented
//! when absent.

use sirinx_core::{BusinessType, Consent, Interest, Lead, LeadDraft};

use crate::agent::{Agent, AgentError, AgentInput, AgentOutput};
use crate::roster::AgentId;

/// `LeadDraft.source` for every lead this scanner emits: the LINE
/// Official Account channel fronting the Thaimart x SIRINX funnel.
const SOURCE_NAME: &str = "line_oa";

/// Thai shorthand multipliers. Chat users quote large bills with
/// magnitude words, not full digits. `ล้าน` is included because ICP
/// factory bills (500K–5M THB/month) are commonly quoted in ล้าน.
const MUEN: f64 = 10_000.0; // หมื่น
const SAEN: f64 = 100_000.0; // แสน
const LAN: f64 = 1_000_000.0; // ล้าน

/// Bill anchor. The prefix `ค่าไฟ` also covers `ค่าไฟฟ้า`; nothing else
/// in Thai commerce chat collides with it.
const BILL_KEYWORDS: &[&str] = &["ค่าไฟ"];

/// Chars after a bill keyword in which the first number is taken as the
/// monthly bill. Covers "ค่าไฟเดือนละประมาณ 5 หมื่น บาท" with slack while
/// staying far from unrelated trailing numbers.
const BILL_WINDOW_CHARS: usize = 40;

/// Area unit markers; the number directly BEFORE the unit wins
/// ("1,500 ตร.ม."). Checked in this order; each match is independent.
const AREA_UNIT_KEYWORDS: &[&str] = &["ตารางเมตร", "ตร.ม.", "ตรม"];

/// Fallback area anchors when no unit is written: the number directly
/// AFTER the noun ("พื้นที่ 800", "หลังคา 500").
const AREA_NOUN_KEYWORDS: &[&str] = &["พื้นที่", "หลังคา"];

/// Gap (chars) allowed between an area number and its unit/noun anchor.
const AREA_WINDOW_CHARS: usize = 24;

/// Explicit contact-request phrases. PDPA discipline: marketing consent
/// requires an unambiguous ask — interest in pricing is NOT consent.
const CONTACT_REQUEST_KEYWORDS: &[&str] = &["ติดต่อกลับ", "โทรกลับ", "โทรหา", "ติดต่อหน่อย"];

/// Business-type keyword sets, checked in ICP-priority order (factory >
/// warehouse > hotel > showroom > office > retail): when a message
/// mentions several, the highest-value segment for solar rooftop wins.
const FACTORY_KEYWORDS: &[&str] = &["โรงงาน"];
const WAREHOUSE_KEYWORDS: &[&str] = &["โกดัง", "คลังสินค้า"];
const HOTEL_KEYWORDS: &[&str] = &["โรงแรม", "รีสอร์ท"];
const SHOWROOM_KEYWORDS: &[&str] = &["โชว์รูม"];
const OFFICE_KEYWORDS: &[&str] = &["สำนักงาน", "ออฟฟิศ"];
const RETAIL_KEYWORDS: &[&str] = &["ร้านค้า", "ร้าน"];

/// Interest keyword sets. A bare `โซลาร์/โซล่าร์` maps to SolarRooftop —
/// rooftop is the flagship offer of the funnel this OA fronts. ASCII
/// keywords match case-insensitively (text is lowercased first).
const SOLAR_ROOFTOP_KEYWORDS: &[&str] = &["โซลาร์", "โซล่าร์"];
const SOLAR_CARPORT_KEYWORDS: &[&str] = &["ที่จอดรถ", "คาร์พอร์ต"];
const BESS_KEYWORDS: &[&str] = &["แบตเตอรี่", "bess", "กักเก็บ"];
const EV_CHARGING_KEYWORDS: &[&str] = &["ชาร์จรถ", "ev", "รถยนต์ไฟฟ้า"];
const AI_EMS_KEYWORDS: &[&str] = &["ai ems", "ems", "ระบบจัดการพลังงาน"];

/// Fallback monthly bill (THB) when the text carries no bill hint.
/// Deliberately BELOW Junai's warm threshold (20K THB): an unparsed chat
/// can never inflate into a warm/hot lead — it scores Cold until a human
/// enriches it. ≈ a typical small shophouse bill.
const DEFAULT_MONTHLY_BILL_THB: f64 = 15_000.0;

/// Fallback area (m²) when the text carries no area hint. ≈ usable
/// rooftop of a typical Thai commercial shophouse; small enough that the
/// ROI pre-screen stays modest.
const DEFAULT_AREA_SQM: f64 = 120.0;

/// One numeric mention found in the normalized text (char indices).
#[derive(Debug, Clone, Copy)]
struct NumberHit {
    value: f64,
    start: usize,
    /// Exclusive end, after the magnitude word if one was consumed.
    end: usize,
}

/// Whether `chars` has `word` at position `at`.
fn matches_at(chars: &[char], at: usize, word: &str) -> bool {
    let word_len = word.chars().count();
    if at + word_len > chars.len() {
        return false;
    }
    chars[at..at + word_len]
        .iter()
        .zip(word.chars())
        .all(|(a, b)| *a == b)
}

/// All start positions of `word` in `chars`.
fn find_all(chars: &[char], word: &str) -> Vec<usize> {
    let word_len = word.chars().count();
    if word_len == 0 {
        return Vec::new();
    }
    (0..=chars.len().saturating_sub(word_len))
        .filter(|&i| matches_at(chars, i, word))
        .collect()
}

/// Normalize raw message text: Thai digits → ASCII, digit-grouping
/// commas dropped, ASCII lowercased. Returns chars (Thai text is
/// multi-byte; char indices keep window arithmetic honest).
fn normalize(text: &str) -> Vec<char> {
    let raw: Vec<char> = text.to_lowercase().chars().collect();
    let is_digit = |c: char| c.is_ascii_digit() || ('๐'..='๙').contains(&c);
    let mut out = Vec::with_capacity(raw.len());
    for (i, &c) in raw.iter().enumerate() {
        match c {
            '๐'..='๙' => {
                out.push(char::from_digit(u32::from(c) - u32::from('๐'), 10).unwrap_or(c))
            }
            ',' if i > 0 && i + 1 < raw.len() && is_digit(raw[i - 1]) && is_digit(raw[i + 1]) => {
                // grouping comma inside a digit run: drop it
            }
            _ => out.push(c),
        }
    }
    out
}

/// Scan all numeric mentions, applying Thai magnitude words.
fn scan_numbers(chars: &[char]) -> Vec<NumberHit> {
    const MAGNITUDES: &[(&str, f64)] = &[("หมื่น", MUEN), ("แสน", SAEN), ("ล้าน", LAN)];
    let mut hits = Vec::new();
    let mut i = 0;
    while i < chars.len() {
        if !chars[i].is_ascii_digit() {
            i += 1;
            continue;
        }
        let start = i;
        let mut j = i;
        while j < chars.len() && chars[j].is_ascii_digit() {
            j += 1;
        }
        // At most one decimal point, only when followed by a digit.
        if j + 1 < chars.len() && chars[j] == '.' && chars[j + 1].is_ascii_digit() {
            j += 1;
            while j < chars.len() && chars[j].is_ascii_digit() {
                j += 1;
            }
        }
        let digits: String = chars[start..j].iter().collect();
        let mut value: f64 = digits.parse().unwrap_or(0.0);
        // Optional magnitude word right after (spaces allowed).
        let mut k = j;
        while k < chars.len() && chars[k] == ' ' {
            k += 1;
        }
        let mut end = j;
        for (word, mult) in MAGNITUDES {
            if matches_at(chars, k, word) {
                value *= mult;
                end = k + word.chars().count();
                break;
            }
        }
        hits.push(NumberHit { value, start, end });
        i = end;
    }
    hits
}

/// First number within the window after a bill keyword.
fn extract_bill(chars: &[char], hits: &[NumberHit]) -> Option<f64> {
    for kw in BILL_KEYWORDS {
        for pos in find_all(chars, kw) {
            let kw_end = pos + kw.chars().count();
            if let Some(hit) = hits
                .iter()
                .find(|h| h.start >= kw_end && h.start - kw_end <= BILL_WINDOW_CHARS)
            {
                return Some(hit.value);
            }
        }
    }
    None
}

/// Number before an area unit marker; else number after an area noun.
fn extract_area(chars: &[char], hits: &[NumberHit]) -> Option<f64> {
    for kw in AREA_UNIT_KEYWORDS {
        for pos in find_all(chars, kw) {
            if let Some(hit) = hits
                .iter()
                .rev()
                .find(|h| h.end <= pos && pos - h.end <= AREA_WINDOW_CHARS)
            {
                return Some(hit.value);
            }
        }
    }
    for kw in AREA_NOUN_KEYWORDS {
        for pos in find_all(chars, kw) {
            let kw_end = pos + kw.chars().count();
            if let Some(hit) = hits
                .iter()
                .find(|h| h.start >= kw_end && h.start - kw_end <= AREA_WINDOW_CHARS)
            {
                return Some(hit.value);
            }
        }
    }
    None
}

fn contains_any(text: &str, keywords: &[&str]) -> bool {
    keywords.iter().any(|k| text.contains(k))
}

/// ICP-priority detection: first matching set wins.
fn detect_business_type(text: &str) -> BusinessType {
    if contains_any(text, FACTORY_KEYWORDS) {
        BusinessType::Factory
    } else if contains_any(text, WAREHOUSE_KEYWORDS) {
        BusinessType::Warehouse
    } else if contains_any(text, HOTEL_KEYWORDS) {
        BusinessType::Hotel
    } else if contains_any(text, SHOWROOM_KEYWORDS) {
        BusinessType::Showroom
    } else if contains_any(text, OFFICE_KEYWORDS) {
        BusinessType::Office
    } else if contains_any(text, RETAIL_KEYWORDS) {
        BusinessType::RetailStore
    } else {
        BusinessType::Other
    }
}

fn detect_interests(text: &str) -> Vec<Interest> {
    let mut interests = Vec::new();
    if contains_any(text, SOLAR_ROOFTOP_KEYWORDS) {
        interests.push(Interest::SolarRooftop);
    }
    if contains_any(text, SOLAR_CARPORT_KEYWORDS) {
        interests.push(Interest::SolarCarport);
    }
    if contains_any(text, BESS_KEYWORDS) {
        interests.push(Interest::Bess);
    }
    if contains_any(text, EV_CHARGING_KEYWORDS) {
        interests.push(Interest::EvCharging);
    }
    if contains_any(text, AI_EMS_KEYWORDS) {
        interests.push(Interest::AiEms);
    }
    if interests.is_empty() {
        // The OA fronts the solar-rooftop funnel; an unparsed enquiry is
        // conservatively tagged rooftop rather than left unclassifiable
        // (LeadDraft requires at least one interest).
        interests.push(Interest::SolarRooftop);
    }
    interests
}

/// L1 Perception: LINE Messaging API webhook event → `Lead` scanner.
pub struct LineEventsScanner;

impl Agent for LineEventsScanner {
    fn id(&self) -> AgentId {
        AgentId(3)
    }

    fn process(&self, input: AgentInput) -> Result<AgentOutput, AgentError> {
        let event_type = input.payload["type"]
            .as_str()
            .ok_or_else(|| AgentError::BadPayload("missing event `type`".into()))?;
        if event_type != "message" {
            return Err(AgentError::BadPayload(format!(
                "unsupported event type '{event_type}'"
            )));
        }
        let message_type = input.payload["message"]["type"]
            .as_str()
            .ok_or_else(|| AgentError::BadPayload("missing `message.type`".into()))?;
        if message_type != "text" {
            return Err(AgentError::BadPayload(format!(
                "unsupported message type '{message_type}'"
            )));
        }
        let text = input.payload["message"]["text"]
            .as_str()
            .ok_or_else(|| AgentError::BadPayload("text message without `message.text`".into()))?;
        // PDPA: userId is personal data — note presence only, never copy
        // it into the lead, never invent one when absent.
        let user_id_present = input.payload["source"]["userId"].as_str().is_some();

        let normalized = normalize(text);
        let hits = scan_numbers(&normalized);
        let haystack: String = normalized.iter().collect();

        let bill = extract_bill(&normalized, &hits);
        let area = extract_area(&normalized, &hits);
        // PDPA: marketing consent ONLY on an explicit contact request.
        let marketing_contact = contains_any(&haystack, CONTACT_REQUEST_KEYWORDS);

        let lead = Lead::from_draft(LeadDraft {
            business_type: detect_business_type(&haystack),
            monthly_electric_bill: bill.unwrap_or(DEFAULT_MONTHLY_BILL_THB),
            available_area_sqm: area.unwrap_or(DEFAULT_AREA_SQM),
            interest: detect_interests(&haystack),
            source: SOURCE_NAME.into(),
            consent: Consent {
                analytics: true, // user-initiated service conversation
                marketing_contact,
            },
        })
        .map_err(|e| AgentError::BadPayload(e.to_string()))?;

        let summary = format!(
            "lead {} scanned from {}: user_id {}, bill {:.0} THB ({}), area {:.0} sqm ({}), marketing_contact={}",
            lead.id,
            SOURCE_NAME,
            if user_id_present { "present" } else { "absent" },
            lead.draft.monthly_electric_bill,
            if bill.is_some() { "text" } else { "default" },
            lead.draft.available_area_sqm,
            if area.is_some() { "text" } else { "default" },
            marketing_contact,
        );
        Ok(AgentOutput {
            summary,
            publish: Some(AgentInput {
                event: "lead-scanned".into(),
                payload: serde_json::to_value(&lead)
                    .map_err(|e| AgentError::BadPayload(e.to_string()))?,
            }),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ronin::Junai;
    use serde_json::json;

    fn webhook(text: &str) -> serde_json::Value {
        json!({
            "type": "message",
            "source": {"userId": "U1234567890abcdef1234567890abcdef"},
            "message": {"type": "text", "text": text}
        })
    }

    fn scan(text: &str) -> AgentOutput {
        LineEventsScanner
            .process(AgentInput {
                event: "line-webhook".into(),
                payload: webhook(text),
            })
            .expect("text message must scan")
    }

    #[test]
    fn happy_path_extracts_bill_area_type_and_consent() {
        let out = scan(
            "สวัสดีครับ โรงงานของผมค่าไฟเดือนละ 2 แสน พื้นที่หลังคาประมาณ 1,500 ตร.ม. \
             สนใจโซลาร์ รบกวนติดต่อกลับครับ",
        );
        assert!(out.summary.contains("user_id present"));

        let publish = out.publish.expect("scanner always forwards");
        assert_eq!(publish.event, "lead-scanned");
        // Byte-shape compatible with Kuranosuke: payload IS the Lead JSON
        // (camelCase wire keys, flattened draft).
        assert!(publish.payload["id"].is_string());
        assert_eq!(publish.payload["status"], "new");
        assert_eq!(publish.payload["businessType"], "factory");
        assert_eq!(publish.payload["monthlyElectricBill"], 200_000.0);
        assert_eq!(publish.payload["availableAreaSqm"], 1_500.0);
        assert_eq!(publish.payload["consent"]["marketingContact"], true);

        let lead: Lead = serde_json::from_value(publish.payload).unwrap();
        assert_eq!(lead.draft.source, SOURCE_NAME);
        assert_eq!(lead.draft.business_type, BusinessType::Factory);
        assert_eq!(lead.draft.monthly_electric_bill, 200_000.0);
        assert_eq!(lead.draft.available_area_sqm, 1_500.0);
        assert!(lead.draft.interest.contains(&Interest::SolarRooftop));
        assert!(lead.draft.consent.analytics);
        assert!(lead.draft.consent.marketing_contact);
    }

    #[test]
    fn non_message_events_and_non_text_messages_are_bad_payload() {
        let follow = LineEventsScanner.process(AgentInput {
            event: "line-webhook".into(),
            payload: json!({"type": "follow", "source": {"userId": "U1"}}),
        });
        assert!(matches!(follow, Err(AgentError::BadPayload(_))));

        let sticker = LineEventsScanner.process(AgentInput {
            event: "line-webhook".into(),
            payload: json!({
                "type": "message",
                "source": {"userId": "U1"},
                "message": {"type": "sticker"}
            }),
        });
        assert!(matches!(sticker, Err(AgentError::BadPayload(_))));

        let no_text = LineEventsScanner.process(AgentInput {
            event: "line-webhook".into(),
            payload: json!({"type": "message", "message": {"type": "text"}}),
        });
        assert!(matches!(no_text, Err(AgentError::BadPayload(_))));
    }

    #[test]
    fn output_feeds_junai_l2_scorer() {
        // Pipeline compat: this L1's envelope must score under any L2.
        let publish = scan("ค่าไฟ 8 หมื่น โกดัง 600 ตรม")
            .publish
            .expect("scanner always forwards");
        let scored = Junai.process(publish).expect("Junai must score LINE leads");
        assert!(scored.summary.contains("scored Hot"));
        let scored_payload = scored.publish.expect("Junai always forwards").payload;
        assert_eq!(scored_payload["temperature"], "hot");
        assert!(scored_payload["roi"]["estimatedKw"].as_f64().unwrap() > 0.0);
    }

    #[test]
    fn thai_shorthand_and_grouped_digits_parse() {
        let cases = [
            ("ค่าไฟ 5 หมื่น", 50_000.0),
            ("ค่าไฟเดือนละ 1.5 แสน บาท", 150_000.0),
            ("ค่าไฟ 80,000 บาท", 80_000.0),
            ("ค่าไฟ ๒ ล้าน", 2_000_000.0), // Thai digits normalize
        ];
        for (text, expected) in cases {
            let chars = normalize(text);
            let hits = scan_numbers(&chars);
            assert_eq!(extract_bill(&chars, &hits), Some(expected), "{text}");
        }
    }

    #[test]
    fn numbers_without_bill_anchor_are_not_bills() {
        // Phone-ish / count numbers must not leak into the bill field.
        let out = scan("สนใจครับ โทร 0812345678 มีสาขา 3 แห่ง");
        let publish = out.publish.unwrap();
        let lead: Lead = serde_json::from_value(publish.payload).unwrap();
        assert_eq!(lead.draft.monthly_electric_bill, DEFAULT_MONTHLY_BILL_THB);
        assert!(out.summary.contains("bill 15000 THB (default)"));
    }

    #[test]
    fn no_explicit_request_means_no_marketing_consent() {
        let out = scan("สอบถามราคาโซลาร์หน่อยครับ");
        let lead: Lead = serde_json::from_value(out.publish.unwrap().payload).unwrap();
        assert!(lead.draft.consent.analytics); // service conversation
        assert!(!lead.draft.consent.marketing_contact); // never inferred
        assert!(out.summary.contains("marketing_contact=false"));
    }

    #[test]
    fn missing_user_id_is_noted_not_invented() {
        let out = LineEventsScanner
            .process(AgentInput {
                event: "line-webhook".into(),
                payload: json!({
                    "type": "message",
                    "source": {"type": "user"},
                    "message": {"type": "text", "text": "ค่าไฟ 3 หมื่น"}
                }),
            })
            .expect("missing userId still scans");
        assert!(out.summary.contains("user_id absent"));
        let lead: Lead = serde_json::from_value(out.publish.unwrap().payload).unwrap();
        assert_eq!(lead.draft.monthly_electric_bill, 30_000.0);
    }
}
