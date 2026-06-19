use std::env;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};

#[derive(Debug)]
struct SkillRecord {
    id: String,
    path: PathBuf,
    category: String,
    risk_hits: Vec<String>,
    decision: String,
    reason: String,
}

fn main() {
    if let Err(err) = run() {
        eprintln!("mercury-skill-triage error: {err}");
        std::process::exit(1);
    }
}

fn run() -> io::Result<()> {
    let mut args = env::args().skip(1);
    let root = args
        .next()
        .map(PathBuf::from)
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "missing mercury clone root"))?;
    let out_dir = args
        .next()
        .map(PathBuf::from)
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "missing output directory"))?;

    let categories = root.join("categories");
    if !categories.is_dir() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("categories directory not found: {}", categories.display()),
        ));
    }

    fs::create_dir_all(&out_dir)?;
    let mut skill_files = Vec::new();
    collect_skill_files(&categories, &mut skill_files)?;
    skill_files.sort();

    let mut records = Vec::new();
    for path in skill_files {
        let content = fs::read_to_string(&path)?;
        let id = skill_id(&categories, &path);
        let category = id.split('/').next().unwrap_or("unknown").to_string();
        let risk_hits = risk_hits(&content);
        let (decision, reason) = classify(&category, &risk_hits);
        records.push(SkillRecord {
            id,
            path,
            category,
            risk_hits,
            decision,
            reason,
        });
    }

    write_csv(&out_dir.join("triage.csv"), &records)?;
    write_bucket(
        &out_dir.join("safe-import-candidates.md"),
        "SAFE_IMPORT_CANDIDATE",
        &records,
    )?;
    write_bucket(
        &out_dir.join("review-required.md"),
        "REVIEW_REQUIRED",
        &records,
    )?;
    write_bucket(
        &out_dir.join("blocked-for-import.md"),
        "BLOCKED_FOR_IMPORT",
        &records,
    )?;
    write_summary(&out_dir.join("summary.json"), &records)?;

    println!("skills_total={}", records.len());
    println!(
        "safe_import_candidates={}",
        records
            .iter()
            .filter(|record| record.decision == "SAFE_IMPORT_CANDIDATE")
            .count()
    );
    println!(
        "review_required={}",
        records
            .iter()
            .filter(|record| record.decision == "REVIEW_REQUIRED")
            .count()
    );
    println!(
        "blocked_for_import={}",
        records
            .iter()
            .filter(|record| record.decision == "BLOCKED_FOR_IMPORT")
            .count()
    );
    Ok(())
}

fn collect_skill_files(dir: &Path, out: &mut Vec<PathBuf>) -> io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            collect_skill_files(&path, out)?;
        } else if path.file_name().is_some_and(|name| name == "SKILL.md") {
            out.push(path);
        }
    }
    Ok(())
}

fn skill_id(categories_root: &Path, path: &Path) -> String {
    let relative = path.strip_prefix(categories_root).unwrap_or(path);
    let mut parts: Vec<String> = relative
        .components()
        .map(|component| component.as_os_str().to_string_lossy().to_string())
        .collect();
    if parts.last().is_some_and(|last| last == "SKILL.md") {
        parts.pop();
    }
    parts.join("/")
}

fn risk_hits(content: &str) -> Vec<String> {
    let lower = content.to_lowercase();
    let patterns = [
        "api key",
        "token",
        "credential",
        "secret",
        "oauth",
        "login",
        "password",
        "payment",
        "credit card",
        "stripe",
        "deploy",
        "publish",
        "post to",
        "send email",
        "webhook",
        "delete",
        "rm -rf",
        "twitter",
        "x.com",
        "download",
        "scrape",
        "medical",
        "legal",
        "contract",
        "financial",
        "investment",
        "health",
        "browser",
        "shell",
        "terminal",
        "docker",
        "kubernetes",
        "terraform",
    ];
    let mut hits = Vec::new();
    for pattern in patterns {
        if lower.contains(pattern) {
            hits.push(pattern.to_string());
        }
    }
    hits
}

fn classify(category: &str, risk_hits: &[String]) -> (String, String) {
    let blocked_categories = [
        "media-download",
        "shop-restaurant",
        "finance-legal",
        "health-wellness",
    ];
    let review_categories = [
        "automation",
        "business",
        "career",
        "devops",
        "marketing",
        "security",
    ];
    let safe_categories = [
        "ai-ml",
        "backend",
        "data",
        "design",
        "development",
        "education-learning",
        "frontend",
        "mobile",
        "pdf-generation",
        "presentation",
        "product",
        "testing-qa",
    ];

    if blocked_categories.contains(&category) {
        return (
            "BLOCKED_FOR_IMPORT".to_string(),
            format!("category {category} requires separate policy review"),
        );
    }

    if review_categories.contains(&category) {
        return (
            "REVIEW_REQUIRED".to_string(),
            format!("category {category} can trigger external workflow side effects"),
        );
    }

    if !risk_hits.is_empty() {
        return (
            "REVIEW_REQUIRED".to_string(),
            format!("risk terms found: {}", risk_hits.join("; ")),
        );
    }

    if safe_categories.contains(&category) {
        return (
            "SAFE_IMPORT_CANDIDATE".to_string(),
            "local developer workflow category with no risk terms".to_string(),
        );
    }

    (
        "REVIEW_REQUIRED".to_string(),
        format!("unknown category {category}"),
    )
}

fn write_csv(path: &Path, records: &[SkillRecord]) -> io::Result<()> {
    let mut out = String::from("decision,category,id,risk_hits,path,reason\n");
    for record in records {
        out.push_str(&format!(
            "{},{},{},{},{},{}\n",
            csv(&record.decision),
            csv(&record.category),
            csv(&record.id),
            csv(&record.risk_hits.join("; ")),
            csv(&record.path.display().to_string()),
            csv(&record.reason)
        ));
    }
    fs::write(path, out)
}

fn write_bucket(path: &Path, decision: &str, records: &[SkillRecord]) -> io::Result<()> {
    let mut out = format!("# Mercury Skills {decision}\n\n");
    out.push_str("Generated by `tools/local-bin/mercury-skill-triage.rs`.\n\n");
    for record in records.iter().filter(|record| record.decision == decision) {
        out.push_str(&format!(
            "- `{}` - category `{}` - {}\n",
            record.id, record.category, record.reason
        ));
    }
    fs::write(path, out)
}

fn write_summary(path: &Path, records: &[SkillRecord]) -> io::Result<()> {
    let total = records.len();
    let safe = count(records, "SAFE_IMPORT_CANDIDATE");
    let review = count(records, "REVIEW_REQUIRED");
    let blocked = count(records, "BLOCKED_FOR_IMPORT");
    let out = format!(
        "{{\n  \"source\": \"mercury-agent-skills read-only clone\",\n  \"skills_total\": {},\n  \"safe_import_candidates\": {},\n  \"review_required\": {},\n  \"blocked_for_import\": {},\n  \"import_performed\": false,\n  \"external_mutation\": false\n}}\n",
        total, safe, review, blocked
    );
    fs::write(path, out)
}

fn count(records: &[SkillRecord], decision: &str) -> usize {
    records
        .iter()
        .filter(|record| record.decision == decision)
        .count()
}

fn csv(value: &str) -> String {
    format!("\"{}\"", value.replace('"', "\"\""))
}
