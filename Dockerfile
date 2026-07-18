# Multi-stage build for the SIRINX Rust services.
# Produces two small images from one build:
#   docker build --target web     -t sirinx-web .
#   docker build --target control -t sirinx-control .
# rustls is used throughout, so no OpenSSL is needed at runtime.

FROM rust:1-slim-bookworm AS builder
WORKDIR /build
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./
COPY crates ./crates
RUN cargo build --release -p sirinx-web -p sirinx-control

FROM gcr.io/distroless/cc-debian12 AS web
COPY --from=builder /build/target/release/sirinx-web /usr/local/bin/sirinx-web
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/usr/local/bin/sirinx-web"]

FROM gcr.io/distroless/cc-debian12 AS control
COPY --from=builder /build/target/release/sirinx-control /usr/local/bin/sirinx-control
EXPOSE 8711
USER nonroot
ENTRYPOINT ["/usr/local/bin/sirinx-control"]
