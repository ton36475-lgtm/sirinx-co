use std::env;
use std::fs;
use std::io;
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug)]
struct Args {
    input: PathBuf,
    out_dir: PathBuf,
    adapter: PathBuf,
    label: String,
    mode: String,
}

fn main() {
    if let Err(err) = run() {
        eprintln!("headroom-evidence-wire error: {err}");
        std::process::exit(1);
    }
}

fn run() -> io::Result<()> {
    let args = parse_args()?;
    if args.mode != "safe-universal-local" {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "only --mode safe-universal-local is allowed",
        ));
    }
    if !args.input.is_file() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("input evidence file not found: {}", args.input.display()),
        ));
    }
    if !args.adapter.is_file() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("adapter binary not found: {}", args.adapter.display()),
        ));
    }

    fs::create_dir_all(&args.out_dir)?;
    let preview = args
        .out_dir
        .join(format!("{}-compressed-preview.md", args.label));
    let metrics = args
        .out_dir
        .join(format!("{}-headroom-metrics.json", args.label));
    let index = args
        .out_dir
        .join(format!("{}-headroom-index.md", args.label));

    let status = Command::new(&args.adapter)
        .arg("compress-file")
        .arg("--input")
        .arg(&args.input)
        .arg("--output")
        .arg(&preview)
        .arg("--metrics")
        .arg(&metrics)
        .arg("--mode")
        .arg(&args.mode)
        .env("HEADROOM_SIRINX_EVIDENCE_WIRE_LOCAL_ONLY", "1")
        .status()?;

    if !status.success() {
        return Err(io::Error::new(
            io::ErrorKind::Other,
            format!("headroom adapter failed with status {status}"),
        ));
    }

    let index_body = format!(
        "# Headroom Evidence Wire Index\n\n\
         - Label: `{label}`\n\
         - Mode: `{mode}`\n\
         - Input: `{input}`\n\
         - Preview: `{preview}`\n\
         - Metrics: `{metrics}`\n\
         - Provider call: false\n\
         - Proxy started: false\n\
         - MCP started: false\n\
         - Source overwritten: false\n\
         - External mutation: false\n",
        label = args.label,
        mode = args.mode,
        input = args.input.display(),
        preview = preview.display(),
        metrics = metrics.display()
    );
    fs::write(&index, index_body)?;

    println!("wire=headroom-evidence-wire");
    println!("mode={}", args.mode);
    println!("input={}", args.input.display());
    println!("preview={}", preview.display());
    println!("metrics={}", metrics.display());
    println!("index={}", index.display());
    println!("provider_call=false");
    println!("proxy_started=false");
    println!("mcp_started=false");
    println!("external_mutation=false");
    Ok(())
}

fn parse_args() -> io::Result<Args> {
    let mut input = None;
    let mut out_dir = None;
    let mut adapter = None;
    let mut label = "evidence".to_string();
    let mut mode = "safe-universal-local".to_string();

    let mut iter = env::args().skip(1);
    let command = iter
        .next()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "missing command"))?;
    if command != "wire" {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "only command `wire` is supported",
        ));
    }

    while let Some(flag) = iter.next() {
        let value = iter.next().ok_or_else(|| {
            io::Error::new(
                io::ErrorKind::InvalidInput,
                format!("missing value for {flag}"),
            )
        })?;
        match flag.as_str() {
            "--input" => input = Some(PathBuf::from(value)),
            "--out-dir" => out_dir = Some(PathBuf::from(value)),
            "--adapter" => adapter = Some(PathBuf::from(value)),
            "--label" => label = value,
            "--mode" => mode = value,
            _ => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidInput,
                    format!("unknown flag {flag}"),
                ))
            }
        }
    }

    Ok(Args {
        input: input
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "--input is required"))?,
        out_dir: out_dir
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "--out-dir is required"))?,
        adapter: adapter
            .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "--adapter is required"))?,
        label,
        mode,
    })
}
