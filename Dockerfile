# Multi-stage build for the SIRINX Rust services.
# Produces two small images from one build:
#   docker build --target web     -t sirinx-web .
#   docker build --target control -t sirinx-control .
# rustls is used throughout, so no OpenSSL is needed at runtime.

FROM rust:1-slim-bookworm@sha256:99e09cb2284e2ddbb73a995deee3e91783fd04d177602ccf6eab326d778ee777 AS builder
WORKDIR /build
COPY Cargo.toml Cargo.lock rust-toolchain.toml ./
COPY crates ./crates
RUN cargo build --release -p sirinx-web -p sirinx-control

FROM gcr.io/distroless/cc-debian12@sha256:7ee09f36862efbdbf70422db263e411c2618409ca46faa555bd5b636155307df AS web
COPY --from=builder /build/target/release/sirinx-web /usr/local/bin/sirinx-web
EXPOSE 8080
USER nonroot
ENTRYPOINT ["/usr/local/bin/sirinx-web"]

FROM gcr.io/distroless/cc-debian12@sha256:7ee09f36862efbdbf70422db263e411c2618409ca46faa555bd5b636155307df AS control
COPY --from=builder /build/target/release/sirinx-control /usr/local/bin/sirinx-control
EXPOSE 8711
USER nonroot
ENTRYPOINT ["/usr/local/bin/sirinx-control"]
