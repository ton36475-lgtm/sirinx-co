use std::env;
use std::fs;
use std::io;
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Default)]
struct Args {
    input: PathBuf,
    output: PathBuf,
    metrics: PathBuf,
    python: PathBuf,
    mode: String,
}

fn main() {
    if let Err(err) = run() {
        eprintln!("hermes-headroom-adapter error: {err}");
        std::process::exit(1);
    }
}

fn run() -> io::Result<()> {
    let args = parse_args()?;
    if args.mode != "safe-universal-local" {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "only --mode safe-universal-local is allowed in this prototype",
        ));
    }
    if !args.input.is_file() {
        return Err(io::Error::new(
            io::ErrorKind::NotFound,
            format!("input file not found: {}", args.input.display()),
        ));
    }
    if let Some(parent) = args.output.parent() {
        fs::create_dir_all(parent)?;
    }
    if let Some(parent) = args.metrics.parent() {
        fs::create_dir_all(parent)?;
    }

    let script = r##"
import json
import os
import sys

from headroom.compression.universal import UniversalCompressor, UniversalCompressorConfig

input_path, output_path, metrics_path = sys.argv[1:4]
with open(input_path, "r", encoding="utf-8") as fh:
    content = fh.read()

config = UniversalCompressorConfig(
    use_magika=False,
    use_kompress=False,
    use_entropy_preservation=True,
    min_content_length=100,
    compression_ratio_target=0.35,
    ccr_enabled=False,
)
result = UniversalCompressor(config=config).compress(content)
with open(output_path, "w", encoding="utf-8") as fh:
    fh.write("# Headroom Hermes Adapter Compressed Preview\n\n")
    fh.write("> Derived local preview. Original evidence remains the source of truth.\n\n")
    fh.write(result.compressed)

metrics = {
    "adapter": "hermes-headroom-adapter",
    "mode": "safe-universal-local",
    "input_path": input_path,
    "output_path": output_path,
    "tokens_before": result.tokens_before,
    "tokens_after": result.tokens_after,
    "tokens_saved": result.tokens_saved,
    "compression_ratio": result.compression_ratio,
    "content_type": str(result.content_type),
    "detection_confidence": result.detection_confidence,
    "handler_used": result.handler_used,
    "preservation_ratio": result.preservation_ratio,
    "provider_call": False,
    "proxy_started": False,
    "mcp_started": False,
    "source_overwritten": False,
    "external_mutation": False,
    "transforms_applied": ["headroom.universal", "simple_compress", "entropy_preservation"],
    "offline_env": {
        "HF_HUB_OFFLINE": os.environ.get("HF_HUB_OFFLINE"),
        "TRANSFORMERS_OFFLINE": os.environ.get("TRANSFORMERS_OFFLINE"),
    },
}
with open(metrics_path, "w", encoding="utf-8") as fh:
    json.dump(metrics, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
"##;

    let status = Command::new(&args.python)
        .arg("-c")
        .arg(script)
        .arg(&args.input)
        .arg(&args.output)
        .arg(&args.metrics)
        .env("HF_HUB_OFFLINE", "1")
        .env("TRANSFORMERS_OFFLINE", "1")
        .env("HEADROOM_SIRINX_ADAPTER_LOCAL_ONLY", "1")
        .status()?;

    if !status.success() {
        return Err(io::Error::new(
            io::ErrorKind::Other,
            format!("headroom python compression failed with status {status}"),
        ));
    }

    println!("adapter=hermes-headroom-adapter");
    println!("mode={}", args.mode);
    println!("input={}", args.input.display());
    println!("output={}", args.output.display());
    println!("metrics={}", args.metrics.display());
    println!("provider_call=false");
    println!("proxy_started=false");
    println!("mcp_started=false");
    println!("external_mutation=false");
    Ok(())
}

fn parse_args() -> io::Result<Args> {
    let mut values = Args {
        python: PathBuf::from("tools/repo-intake/2026-06-06/venvs/headroom/bin/python"),
        mode: "safe-universal-local".to_string(),
        ..Args::default()
    };

    let mut iter = env::args().skip(1);
    let command = iter
        .next()
        .ok_or_else(|| io::Error::new(io::ErrorKind::InvalidInput, "missing command"))?;
    if command != "compress-file" {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "only command `compress-file` is supported",
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
            "--input" => values.input = PathBuf::from(value),
            "--output" => values.output = PathBuf::from(value),
            "--metrics" => values.metrics = PathBuf::from(value),
            "--python" => values.python = PathBuf::from(value),
            "--mode" => values.mode = value,
            _ => {
                return Err(io::Error::new(
                    io::ErrorKind::InvalidInput,
                    format!("unknown flag {flag}"),
                ))
            }
        }
    }

    if values.input.as_os_str().is_empty()
        || values.output.as_os_str().is_empty()
        || values.metrics.as_os_str().is_empty()
    {
        return Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "--input, --output, and --metrics are required",
        ));
    }
    Ok(values)
}
